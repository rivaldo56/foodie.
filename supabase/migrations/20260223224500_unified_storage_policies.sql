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
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Public Read Access for ' || bucket_name);
        EXECUTE format('CREATE POLICY %I ON storage.objects FOR SELECT USING (bucket_id = %L)', 'Public Read Access for ' || bucket_name, bucket_name);

        -- Admin Write Access (Insert)
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Admin Write Access for ' || bucket_name);
        EXECUTE format('CREATE POLICY %I ON storage.objects FOR INSERT WITH CHECK (bucket_id = %L AND (
            (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin''
            OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
        ))', 'Admin Write Access for ' || bucket_name, bucket_name);

        -- Admin Update Access
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Admin Update Access for ' || bucket_name);
        EXECUTE format('CREATE POLICY %I ON storage.objects FOR UPDATE USING (bucket_id = %L AND (
            (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin''
            OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
        ))', 'Admin Update Access for ' || bucket_name, bucket_name);

        -- Admin Delete Access
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', 'Admin Delete Access for ' || bucket_name);
        EXECUTE format('CREATE POLICY %I ON storage.objects FOR DELETE USING (bucket_id = %L AND (
            (auth.jwt() -> ''app_metadata'' ->> ''role'') = ''admin''
            OR EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid())
        ))', 'Admin Delete Access for ' || bucket_name, bucket_name);
    END LOOP;
END $$;
