-- Migration: Add experience_years to chefs table
ALTER TABLE chefs ADD COLUMN IF NOT EXISTS experience_years INTEGER DEFAULT 0;

COMMENT ON COLUMN chefs.experience_years IS 'Number of years of culinary experience for the chef.';
