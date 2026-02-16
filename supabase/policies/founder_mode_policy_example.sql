-- EXAMPLE RLS POLICY FOR ADMIN TABLES
-- Apply this policy to any table that requires Admin OR Founder Mode access.

-- Policy: "Admins and Active Founder Mode users can select"
-- REPLACES: create policy "Admin only" on "some_table" ...

/*
CREATE POLICY "Admin or Founder Mode Access"
ON public.your_protected_table
FOR ALL
TO authenticated
USING (
  -- Check for standard admin role
  (auth.jwt() ->> 'role' = 'admin') 
  OR 
  (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  OR
  (
    -- Check for Founder Mode claim
    (auth.jwt() -> 'app_metadata' ->> 'founder_mode')::boolean = true
    AND
    -- Check expiration (important!)
    (auth.jwt() -> 'app_metadata' ->> 'founder_mode_expires')::bigint > extract(epoch from now())
  )
);
*/

-- NOTE: 
-- 1. `auth.jwt()` accesses the JSON Web Token.
-- 2. `app_metadata` is where custom claims live.
-- 3. We cast `founder_mode` to boolean and `founder_mode_expires` to bigint.
-- 4. We compare expiration timestamp against current epoch time.
