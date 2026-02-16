-- Storage: Create buckets "experiences" and "menus" in Supabase Dashboard (Storage) if not present.
-- Add status and slug to experiences
ALTER TABLE experiences
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_experiences_status ON experiences(status);
CREATE INDEX IF NOT EXISTS idx_experiences_slug ON experiences(slug) WHERE slug IS NOT NULL;

-- Add status to menus
ALTER TABLE menus
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive'));

CREATE INDEX IF NOT EXISTS idx_menus_status ON menus(status);

-- Add experience_id to bookings (for reporting)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS experience_id UUID REFERENCES experiences(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_experience_id ON bookings(experience_id);

-- Backfill experience_id from menu for existing rows
UPDATE bookings b
SET experience_id = m.experience_id
FROM menus m
WHERE b.menu_id = m.id AND b.experience_id IS NULL;

-- RLS: Replace "viewable by everyone" with public = published/active only; admins see all

-- Experiences: drop old policy, create new
DROP POLICY IF EXISTS "Public experiences are viewable by everyone" ON experiences;
CREATE POLICY "Public can view published experiences"
ON experiences FOR SELECT
USING (status = 'published' OR is_admin());

-- Menus: drop old policy, create new
DROP POLICY IF EXISTS "Public menus are viewable by everyone" ON menus;
CREATE POLICY "Public can view active menus"
ON menus FOR SELECT
USING (status = 'active' OR is_admin());

-- Bookings: admins can update any booking (status lifecycle)
CREATE POLICY "Admins can update bookings"
ON bookings FOR UPDATE
USING (is_admin());
