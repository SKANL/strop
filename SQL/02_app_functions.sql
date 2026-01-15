-- ==============================================================================
-- Function: get_dashboard_stats
-- Description: Returns summary statistics for the dashboard in a single query.
--              PENDING: Assigned to user && Status != CLOSED
--              CRITICAL: Assigned to user && Status != CLOSED && Priority == CRITICAL
-- Security: SECURITY DEFINER (Runs as creator), but uses auth.uid() for filtering.
--           This ensures we only count user's OWN assigned items.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
    user_record_id UUID;
    pending_count INT;
    critical_count INT;
BEGIN
    -- 1. Get Current User ID from Auth
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Resolve Public User ID
    SELECT id INTO user_record_id
    FROM public.users
    WHERE auth_id = current_uid;

    IF user_record_id IS NULL THEN
         RETURN json_build_object('pending', 0, 'critical', 0);
    END IF;

    -- 3. Calculate Pending (Assigned to me, not Closed)
    SELECT COUNT(*) INTO pending_count
    FROM public.incidents
    WHERE assigned_to = user_record_id
    AND status != 'CLOSED';

    -- 4. Calculate Critical (Assigned to me, Critical, not Closed)
    SELECT COUNT(*) INTO critical_count
    FROM public.incidents
    WHERE assigned_to = user_record_id
    AND status != 'CLOSED'
    AND priority = 'CRITICAL';

    -- 5. Return JSON
    RETURN json_build_object(
        'pending', pending_count,
        'critical', critical_count
    );
END;
$$;

COMMENT ON FUNCTION public.get_dashboard_stats IS 'Returns pending and critical incident counts for the authenticated user.';

-- ==============================================================================
-- Function: get_my_projects
-- Description: Returns list of projects user is a member of, with computed counts.
--              Includes: member_count, open_incidents_count
-- Security: SECURITY DEFINER + explicit membership check.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_my_projects()
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    name TEXT,
    location TEXT,
    start_date DATE,
    end_date DATE,
    status public.project_status,
    owner_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    member_count BIGINT,
    open_incidents_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
    user_record_id UUID;
BEGIN
    -- 1. Get Current User ID from Auth
    current_uid := auth.uid();
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Resolve Public User ID
    SELECT u.id INTO user_record_id
    FROM public.users u
    WHERE u.auth_id = current_uid;

    IF user_record_id IS NULL THEN
         RETURN; -- Return empty set
    END IF;

    -- 3. Return Projects with Counts
    RETURN QUERY
    SELECT 
        p.id,
        p.organization_id,
        p.name::text,
        p.location::text,
        p.start_date,
        p.end_date,
        p.status,
        p.owner_id,
        p.created_at,
        p.updated_at,
        (
            SELECT COUNT(*)::BIGINT 
            FROM public.project_members pm_count 
            WHERE pm_count.project_id = p.id
        ) as member_count,
        (
            SELECT COUNT(*)::BIGINT 
            FROM public.incidents i_count 
            WHERE i_count.project_id = p.id 
            AND i_count.status != 'CLOSED'
        ) as open_incidents_count
    FROM public.projects p
    INNER JOIN public.project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = user_record_id
    ORDER BY p.created_at DESC;

END;
$$;

COMMENT ON FUNCTION public.get_my_projects IS 'Returns projects the user belongs to with member and incident counts.';
