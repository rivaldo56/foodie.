-- ULTIMATE REPAIR: Ensure all columns exist on chefs table and reload cache
DO $$ 
BEGIN
    -- Ensure Enum Types
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chef_experience_level') THEN
        CREATE TYPE chef_experience_level AS ENUM ('beginner', 'intermediate', 'experienced', 'expert');
    END IF;

    -- Add columns one by one IF NOT EXISTS
    
    -- Core Identity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='name') THEN
        ALTER TABLE chefs ADD COLUMN "name" TEXT DEFAULT 'Chef';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='bio') THEN
        ALTER TABLE chefs ADD COLUMN bio TEXT;
    END IF;

    -- Onboarding State
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='onboarding_status') THEN
        ALTER TABLE chefs ADD COLUMN onboarding_status TEXT DEFAULT 'pending_verification';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='onboarding_step') THEN
        ALTER TABLE chefs ADD COLUMN onboarding_step INTEGER DEFAULT 1;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='onboarding_data') THEN
        ALTER TABLE chefs ADD COLUMN onboarding_data JSONB DEFAULT '{}';
    END IF;

    -- Experience & Skills
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='experience_level') THEN
        ALTER TABLE chefs ADD COLUMN experience_level chef_experience_level DEFAULT 'experienced';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='experience_years') THEN
        ALTER TABLE chefs ADD COLUMN experience_years INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='cuisine_specialties') THEN
        ALTER TABLE chefs ADD COLUMN cuisine_specialties TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='specialties') THEN
        ALTER TABLE chefs ADD COLUMN specialties TEXT[] DEFAULT '{}';
    END IF;

    -- Status
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='verified') THEN
        ALTER TABLE chefs ADD COLUMN verified BOOLEAN DEFAULT false;
    END IF;

END $$;

-- FORCE SCHEMA CACHE RELOAD
-- This tells PostgREST to re-scan the tables.
NOTIFY pgrst, 'reload schema';
