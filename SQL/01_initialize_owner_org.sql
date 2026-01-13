-- ==============================================================================
-- Function: initialize_owner_organization
-- Description: Creates a new organization, makes the current user the OWNER, 
--              and sets it as their current context.
-- Security: SECURITY DEFINER (Runs with privileges of the creator to bypass RLS 
--           during initial setup if needed, though RLS should allow INSERTs for auth'd users)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.initialize_owner_organization(
    org_name TEXT,
    plan_type public.subscription_plan DEFAULT 'STARTER'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_uid UUID;
    user_record_id UUID;
    new_org_id UUID;
    generated_slug TEXT;
    base_slug TEXT;
    slug_exists BOOLEAN;
    slug_suffix INT := 0;
BEGIN
    -- 1. Get Current User ID from Auth
    current_uid := auth.uid();
    
    IF current_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Validate User Exists in Public Table
    SELECT id INTO user_record_id
    FROM public.users
    WHERE auth_id = current_uid;

    IF user_record_id IS NULL THEN
        RAISE EXCEPTION 'User profile not found. Complete sign up first.';
    END IF;

    -- 3. Check if user already has an organization (Optional: Enforce 1 org per owner for MVP)
    -- Uncomment if strict 1-org limit is desired
    -- IF EXISTS (SELECT 1 FROM organization_members WHERE user_id = user_record_id AND role = 'OWNER') THEN
    --    RAISE EXCEPTION 'User already owns an organization';
    -- END IF;

    -- 4. Generate Slug
    -- Convert to lower case, replace non-alphanumeric with hyphen, remove leading/trailing hyphens
    base_slug := lower(regexp_replace(trim(org_name), '[^a-zA-Z0-9]+', '-', 'g'));
    -- Remove multi-hyphens
    base_slug := regexp_replace(base_slug, '-+', '-', 'g');
    -- Strip start/end hyphens
    base_slug := trim(both '-' from base_slug);
    
    -- Fallback for empty slug
    IF length(base_slug) < 2 THEN
        base_slug := 'org-' || substring(md5(random()::text) from 1 for 6);
    END IF;

    -- Unique Slug Logic
    generated_slug := base_slug;
    LOOP
        SELECT EXISTS (SELECT 1 FROM public.organizations WHERE slug = generated_slug)
        INTO slug_exists;
        
        EXIT WHEN NOT slug_exists;
        
        slug_suffix := slug_suffix + 1;
        generated_slug := base_slug || '-' || slug_suffix;
    END LOOP;

    -- 5. Create Organization
    INSERT INTO public.organizations (
        name,
        slug,
        plan,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        org_name,
        generated_slug,
        plan_type,
        TRUE,
        NOW(),
        NOW()
    ) RETURNING id INTO new_org_id;

    -- 6. Assign Owner Role
    INSERT INTO public.organization_members (
        user_id,
        organization_id,
        role,
        joined_at
    ) VALUES (
        user_record_id,
        new_org_id,
        'OWNER',
        NOW()
    );

    -- 7. Update User's Current Context
    UPDATE public.users
    SET current_organization_id = new_org_id,
        updated_at = NOW()
    WHERE id = user_record_id;

    RETURN new_org_id;
END;
$$;

COMMENT ON FUNCTION public.initialize_owner_organization IS 'Creates a new organization and assigns the current authenticated user as its OWNER.';
