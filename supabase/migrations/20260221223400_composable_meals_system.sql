-- 1. Create meals Table
CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text,
  kcal integer,
  category text CHECK (category IN ('starter','main','dessert','side','drink')),
  cuisine_type text,
  dietary_tags text[] DEFAULT '{}',
  price numeric,
  total_bookings integer DEFAULT 0,
  average_rating numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS meals_category_idx ON meals(category);
CREATE INDEX IF NOT EXISTS meals_active_idx ON meals(is_active);
CREATE INDEX IF NOT EXISTS meals_popularity_idx ON meals(total_bookings DESC);

-- 2. Create menu_meals Junction Table
CREATE TABLE IF NOT EXISTS menu_meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id uuid REFERENCES menus(id) ON DELETE CASCADE,
  meal_id uuid REFERENCES meals(id) ON DELETE CASCADE,
  course_type text CHECK (course_type IN ('starter','main','dessert')),
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- Add index
CREATE INDEX IF NOT EXISTS menu_meals_menu_idx ON menu_meals(menu_id);

-- 🔐 RLS POLICIES

-- Enable RLS
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_meals ENABLE ROW LEVEL SECURITY;

-- Meals: Public can SELECT where is_active = true
DROP POLICY IF EXISTS "Public can view active meals" ON meals;
CREATE POLICY "Public can view active meals"
ON meals FOR SELECT
USING (is_active = true);

-- Admin can manage meals
DROP POLICY IF EXISTS "Admins can manage meals" ON meals;
CREATE POLICY "Admins can manage meals"
ON meals FOR ALL
USING (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- Menu_meals: Public can SELECT
DROP POLICY IF EXISTS "Public can view menu meals" ON menu_meals;
CREATE POLICY "Public can view menu meals"
ON menu_meals FOR SELECT
USING (true);

-- Admin can manage menu_meals
DROP POLICY IF EXISTS "Admins can manage menu meals" ON menu_meals;
CREATE POLICY "Admins can manage menu meals"
ON menu_meals FOR ALL
USING (
  auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
  OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
);

-- 📦 STORAGE

-- Create Supabase Storage bucket: meals
-- Note: Bucket creation via SQL might require higher privileges, often done via dashboard or API.
-- This insert assumes the storage schema is available and correctly configured.
INSERT INTO storage.buckets (id, name, public)
VALUES ('meals', 'meals', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for meals bucket
-- Public read
DROP POLICY IF EXISTS "Public can view meal images" ON storage.objects;
CREATE POLICY "Public can view meal images"
ON storage.objects FOR SELECT
USING (bucket_id = 'meals');

-- Admin write
DROP POLICY IF EXISTS "Admins can upload meal images" ON storage.objects;
CREATE POLICY "Admins can upload meal images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'meals'
  AND (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins can update meal images" ON storage.objects;
CREATE POLICY "Admins can update meal images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'meals'
  AND (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  )
);

DROP POLICY IF EXISTS "Admins can delete meal images" ON storage.objects;
CREATE POLICY "Admins can delete meal images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'meals'
  AND (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'
    OR EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid())
  )
);

-- 3. Functions
CREATE OR REPLACE FUNCTION increment_meal_bookings(meal_id_input uuid)
RETURNS void AS $$
BEGIN
  UPDATE meals
  SET total_bookings = total_bookings + 1
  WHERE id = meal_id_input;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
