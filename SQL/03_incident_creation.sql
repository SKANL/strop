-- ==============================================================================
-- Function: create_incident
-- Description: Creates a new incident with strict validation and default values.
--              Automatically assigns organization based on the project.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_incident(
    p_project_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_incident_type TEXT,
    p_priority TEXT,
    p_location TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator to ensure RLS doesn't block internal logic, though we check permissions manually
SET search_path = public
AS $$
DECLARE
    v_org_id UUID;
    v_new_incident_id UUID;
    v_user_id UUID;
BEGIN
    -- 1. Get Current User
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Validate Project and Get Organization
    SELECT organization_id INTO v_org_id
    FROM public.projects
    WHERE id = p_project_id;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Project not found or invalid';
    END IF;

    -- 3. Verify User Membership in Project
    IF NOT EXISTS (
        SELECT 1 FROM public.project_members
        WHERE project_id = p_project_id 
        AND user_id = (SELECT id FROM public.users WHERE auth_id = v_user_id)
    ) THEN
        RAISE EXCEPTION 'User is not a member of this project';
    END IF;

    -- 4. Create Incident
    INSERT INTO public.incidents (
        project_id,
        organization_id,
        title,
        description,
        incident_type,
        priority,
        status,
        location,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        p_project_id,
        v_org_id,
        p_title,
        p_description,
        p_incident_type::public.incident_type, -- Cast to enum
        p_priority::public.incident_priority, -- Cast to enum
        'OPEN', -- Default status
        p_location,
        (SELECT id FROM public.users WHERE auth_id = v_user_id),
        NOW(),
        NOW()
    ) RETURNING id INTO v_new_incident_id;

    RETURN v_new_incident_id;
END;
$$;

COMMENT ON FUNCTION public.create_incident IS 'Creates a new incident, validating project membership and assigning the correct organization.';
