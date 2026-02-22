-- Add featured column to menus table
ALTER TABLE menus ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Add performance indexes for home feed discovery
CREATE INDEX IF NOT EXISTS idx_experiences_status_featured ON experiences(status, is_featured);
CREATE INDEX IF NOT EXISTS idx_menus_status_featured ON menus(status, featured);
CREATE INDEX IF NOT EXISTS idx_menus_experience_id_active ON menus(experience_id) WHERE status = 'active';

-- Update RLS for menus to ensure featured items are also public
DROP POLICY IF EXISTS "Public can view active menus" ON menus;
CREATE POLICY "Public can view active menus"
ON menus FOR SELECT
USING (status = 'active' OR is_admin());
