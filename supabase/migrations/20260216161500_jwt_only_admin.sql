-- Refactor Admin Access to JWT-Only
-- 1. Update is_admin function to use JWT metadata from app_metadata.role
-- 2. Remove the admin_users table as it is no longer the source of truth

-- Update the helper function to check JWT metadata directly
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- We check app_metadata for the role. This is set by admin action in Supabase
  -- and is included in the JWT, making it a deterministic source of truth.
  RETURN (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove admin_users table and its associated objects
-- Note: We drop any policies that reference the table directly if they exist
-- (Most of our policies use the is_admin() function, so they will continue to work)

DROP TABLE IF EXISTS admin_users CASCADE;

-- If we had any custom triggers or functions specifically for admin_users, they would be dropped by CASCADE
-- The update_updated_at_column trigger was dropped via CASCADE on admin_users table.
