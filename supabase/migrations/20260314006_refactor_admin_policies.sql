-- Refactor Admin Policies to use is_admin() helper
-- This migration repairs policies across the system that were broken by the removal of the admin_users table.

-- 1. Ensure is_admin() helper function exists and is correct
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Repair Storage Policies (Unified Storage)
DO $$
DECLARE
    bucket_name TEXT;
    buckets TEXT[] := ARRAY['experiences', 'menus', 'meals', 'images', 'avatars', 'menu-courses'];
BEGIN
    FOREACH bucket_name IN ARRAY buckets LOOP
        -- Admin Write Access (Insert)
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Admin Write Access for ' || bucket_name);
        EXECUTE format('CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND is_admin())', 'Admin Write Access for ' || bucket_name, bucket_name);

        -- Admin Update Access
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Admin Update Access for ' || bucket_name);
        EXECUTE format('CREATE POLICY %I ON storage.objects FOR UPDATE USING (bucket_id = %L AND is_admin())', 'Admin Update Access for ' || bucket_name, bucket_name);

        -- Admin Delete Access
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Admin Delete Access for ' || bucket_name);
        EXECUTE format('CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L AND is_admin())', 'Admin Delete Access for ' || bucket_name, bucket_name);
    END LOOP;
END $$;

-- 3. Repair Meals & Menu Meals Policies
DROP POLICY IF EXISTS "Admins can manage meals" ON meals;
CREATE POLICY "Admins can manage meals" ON meals FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage menu meals" ON menu_meals;
CREATE POLICY "Admins can manage menu meals" ON menu_meals FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 4. Repair Core Tables from older schema (if they still use direct table checks)
DROP POLICY IF EXISTS "Admins can manage bookings" ON bookings;
CREATE POLICY "Admins can manage bookings" ON bookings FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage chefs" ON chefs;
CREATE POLICY "Admins can manage chefs" ON chefs FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can manage menus" ON menus;
CREATE POLICY "Admins can manage menus" ON menus FOR ALL USING (is_admin()) WITH CHECK (is_admin());

NOTIFY pgrst, 'reload schema';
