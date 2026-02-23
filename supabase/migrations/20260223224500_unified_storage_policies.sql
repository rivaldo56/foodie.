-- Unified Storage Configuration for Foodie V2
-- This migration ensures all required buckets exist and have consistent RLS policies.

-- 1. Ensure all buckets exist in storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('experiences', 'experiences', true),
  ('menus', 'menus', true),
  ('meals', 'meals', true),
  ('images', 'images', true),
  ('avatars', 'avatars', true),
  ('menu-courses', 'menu-courses', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Clean up any existing policies for these buckets to avoid conflicts
-- We use a loop to apply policies to all relevant buckets for consistency

DO $$
DECLARE
    bucket_name TEXT;
    buckets TEXT[] := ARRAY['experiences', 'menus', 'meals', 'images', 'avatars', 'menu-courses'];
BEGIN
    FOREACH bucket_name IN ARRAY buckets LOOP
        -- Public Read Access
        EXECUTE format('DROP POLICY IF EXISTS "Public Read Access for %I" ON storage.objects', bucket_name);
        EXECUTE format('CREATE POLICY "Public Read Access for %I" ON storage.objects FOR SELECT USING (bucket_id = %L)', bucket_name, bucket_name);

        -- Admin Write Access (Insert)
        EXECUTE format('DROP POLICY IF EXISTS "Admin Write Access for %I" ON storage.objects', bucket_name);
        EXECUTE format('CREATE POLICY "Admin Write Access for %I" ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND (
            (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin''
            OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
        ))', bucket_name, bucket_name);

        -- Admin Update Access
        EXECUTE format('DROP POLICY IF EXISTS "Admin Update Access for %I" ON storage.objects', bucket_name);
        EXECUTE format('CREATE POLICY "Admin Update Access for %I" ON storage.objects FOR UPDATE USING (bucket_id = %L AND (
            (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin''
            OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
        ))', bucket_name, bucket_name);

        -- Admin Delete Access
        EXECUTE format('DROP POLICY IF EXISTS "Admin Delete Access for %I" ON storage.objects', bucket_name);
        EXECUTE format('CREATE POLICY "Admin Delete Access for %I" ON storage.objects FOR DELETE USING (bucket_id = %L AND (
            (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin''
            OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
        ))', bucket_name, bucket_name);
    END LOOP;
END $$;
