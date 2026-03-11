-- Migration: Ensure experience_level column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chef_experience_level') THEN
        CREATE TYPE chef_experience_level AS ENUM ('beginner', 'intermediate', 'experienced', 'expert');
    END IF;
END $$;

ALTER TABLE chefs ADD COLUMN IF NOT EXISTS experience_level chef_experience_level DEFAULT 'experienced';
