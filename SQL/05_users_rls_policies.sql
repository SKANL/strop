-- Migration: Add additional RLS policies for public.users
-- Purpose: allow authenticated users to INSERT their own user row (safe check)
-- and allow the supabase_auth_admin role to manage users for auth hook operations.

-- Note: RLS is already ENABLED for public.users in the main schema file.

-- 1) Allow authenticated users to INSERT their own user record (basic checks)
CREATE POLICY "Authenticated can insert own user"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (
  auth_id = (SELECT auth.uid())
  -- Ensure email matches the JWT if present (defensive)
  AND (auth.jwt() ->> 'email' IS NULL OR email = (auth.jwt() ->> 'email'))
);

-- 2) Allow the supabase_auth_admin role (internal auth hooks) to manage users
CREATE POLICY "supabase_auth_admin can manage users"
ON public.users
AS PERMISSIVE FOR ALL
TO supabase_auth_admin
USING (true)
WITH CHECK (true);

-- 3) Prevent direct DELETEs by clients: no policy for DELETE (default DENY)
-- If you want to allow soft-delete via UPDATE only (set deleted_at), keep default and rely on UPDATE policy above.

-- 4) Notes:
-- - The auth.users trigger (public.handle_new_user) runs as SECURITY DEFINER and creates user rows when a new auth user is created.
-- - This migration keeps the SELECT/UPDATE policies scoped to auth_id = auth.uid() and grants admin role broad access for JWT hook operations.
-- - Review and adjust policies if you need org-level SELECTs on users (e.g. admin listing members) — prefer an RPC that joins organization_members under SECURITY DEFINER to avoid recursion.
