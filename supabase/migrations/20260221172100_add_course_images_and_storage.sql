-- Add course image and title columns to menus table
ALTER TABLE menus
ADD COLUMN IF NOT EXISTS starter_image_url TEXT,
ADD COLUMN IF NOT EXISTS main_image_url TEXT,
ADD COLUMN IF NOT EXISTS dessert_image_url TEXT,
ADD COLUMN IF NOT EXISTS starter_title TEXT DEFAULT 'Starter',
ADD COLUMN IF NOT EXISTS main_title TEXT DEFAULT 'Main Course',
ADD COLUMN IF NOT EXISTS dessert_title TEXT DEFAULT 'Dessert';

-- Add unique constraint to prevent duplicate menu names per experience
-- This also supports ON CONFLICT clauses in seed files
ALTER TABLE menus DROP CONSTRAINT IF EXISTS unique_menu_name_per_experience;
ALTER TABLE menus
ADD CONSTRAINT unique_menu_name_per_experience UNIQUE (experience_id, name);

-- Create storage buckets if they don't exist
-- Note: This requires the 'postgres' or similar high-privilege role
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('menu-courses', 'menu-courses', true),
  ('menus', 'menus', true),
  ('experiences', 'experiences', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for menu-courses bucket
-- Note: Bucket itself must be created via Dashboard as per Supabase limitations

-- Allow public read access
DROP POLICY IF EXISTS "Public can view menu course images" ON storage.objects;
CREATE POLICY "Public can view menu course images"
ON storage.objects FOR SELECT
USING (bucket_id = 'menu-courses');

-- Allow admins to upload
DROP POLICY IF EXISTS "Admins can upload menu course images" ON storage.objects;
CREATE POLICY "Admins can upload menu course images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'menu-courses' 
  AND (
    auth.uid() IN (SELECT user_id FROM admin_users)
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
);

-- Allow admins to update
DROP POLICY IF EXISTS "Admins can update menu course images" ON storage.objects;
CREATE POLICY "Admins can update menu course images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'menu-courses'
  AND (
    auth.uid() IN (SELECT user_id FROM admin_users)
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
);

-- Allow admins to delete
DROP POLICY IF EXISTS "Admins can delete menu course images" ON storage.objects;
CREATE POLICY "Admins can delete menu course images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'menu-courses'
  AND (
    auth.uid() IN (SELECT user_id FROM admin_users)
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
);
