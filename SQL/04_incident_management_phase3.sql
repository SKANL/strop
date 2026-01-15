-- ==============================================================================
-- PHASE 3: INCIDENT MANAGEMENT & DETAILS
-- ==============================================================================

-- 1. ADD COMMENT RPC
-- Allows authenticated users to add comments to incidents in their organization.
-- Validation: User must belong to the same org as the incident.

CREATE OR REPLACE FUNCTION public.add_incident_comment(
    p_incident_id UUID,
    p_text TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
    user_record_id UUID;
    v_org_id UUID;
    incident_org_id UUID;
BEGIN
    -- 1. Get Current User and Org
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT id, current_organization_id 
    INTO user_record_id, v_org_id
    FROM public.users
    WHERE auth_id = current_uid;

    IF user_record_id IS NULL OR v_org_id IS NULL THEN
        RAISE EXCEPTION 'User profile incomplete or no organization context';
    END IF;

    -- 2. Validate Incident belongs to User's Org
    SELECT organization_id INTO incident_org_id
    FROM public.incidents
    WHERE id = p_incident_id;

    IF incident_org_id IS NULL THEN
        RAISE EXCEPTION 'Incident not found';
    END IF;

    IF incident_org_id != v_org_id THEN
        RAISE EXCEPTION 'Permission denied: Incident belongs to different organization';
    END IF;

    -- 3. Insert Comment
    INSERT INTO public.comments (
        organization_id,
        incident_id,
        author_id,
        text,
        created_at
    ) VALUES (
        v_org_id,
        p_incident_id,
        user_record_id,
        p_text,
        NOW()
    ) RETURNING id INTO p_incident_id; -- Reusing variable for return, slightly confusing naming but valid logic: actually returns new comment ID

    RETURN p_incident_id; 
END;
$$;

COMMENT ON FUNCTION public.add_incident_comment IS 'Phase 3: Adds a comment to an incident securely.';

-- 2. CLOSE INCIDENT RPC
-- Allows authorized users to close an incident.
-- Permissions: Creator, Assignee, or Roles (OWNER, SUPERINTENDENT, RESIDENT).

CREATE OR REPLACE FUNCTION public.close_incident(
    p_incident_id UUID,
    p_closed_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
    user_record_id UUID;
    v_org_id UUID;
    v_org_role public.user_role;
    incident_record RECORD;
    has_permission BOOLEAN := FALSE;
BEGIN
    -- 1. Get Current User Context
    current_uid := auth.uid();
    
    SELECT u.id, u.current_organization_id, om.role
    INTO user_record_id, v_org_id, v_org_role
    FROM public.users u
    LEFT JOIN public.organization_members om 
        ON u.id = om.user_id AND u.current_organization_id = om.organization_id
    WHERE u.auth_id = current_uid;

    IF user_record_id IS NULL THEN
        RAISE EXCEPTION 'User not found';
    END IF;

    -- 2. Get Incident Data
    SELECT * INTO incident_record
    FROM public.incidents
    WHERE id = p_incident_id;

    IF incident_record.id IS NULL THEN
        RAISE EXCEPTION 'Incident not found';
    END IF;

    -- 3. Check Organization Match
    IF incident_record.organization_id != v_org_id THEN
        RAISE EXCEPTION 'Permission denied: Organization mismatch';
    END IF;

    -- 4. Check Permissions
    -- Allowed: Creator, Assignee
    IF incident_record.created_by = user_record_id OR incident_record.assigned_to = user_record_id THEN
        has_permission := TRUE;
    -- Allowed: OWNER, SUPERINTENDENT, RESIDENT
    ELSIF v_org_role IN ('OWNER', 'SUPERINTENDENT', 'RESIDENT') THEN
        has_permission := TRUE;
    END IF;

    IF NOT has_permission THEN
        RAISE EXCEPTION 'Permission denied: You cannot close this incident';
    END IF;

    -- 5. Update Status
    UPDATE public.incidents
    SET 
        status = 'CLOSED',
        closed_at = NOW(),
        closed_by = user_record_id,
        closed_notes = p_closed_notes,
        updated_at = NOW()
    WHERE id = p_incident_id;

    RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.close_incident IS 'Phase 3: Closes an incident if user is creator, assignee, or has required role.';

-- 3. GET INCIDENT COMMENTS RPC (Optional but useful for consistent joins/ordering)
-- While simple Select works, RPC ensures we get author details consistently.

CREATE OR REPLACE FUNCTION public.get_incident_comments(
    p_incident_id UUID
)
RETURNS TABLE (
    id UUID,
    text TEXT,
    created_at TIMESTAMPTZ,
    author_id UUID,
    author_name TEXT,
    author_avatar TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.text,
        c.created_at,
        c.author_id,
        u.full_name as author_name,
        u.profile_picture_url as author_avatar
    FROM public.comments c
    JOIN public.users u ON c.author_id = u.id
    WHERE c.incident_id = p_incident_id
    ORDER BY c.created_at ASC;
END;
$$;

COMMENT ON FUNCTION public.get_incident_comments IS 'Phase 3: Fetch comments with author details.';
