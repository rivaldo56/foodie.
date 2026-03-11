-- ULTIMATE REPAIR V3: Resolve Trigger Errors & Ensure Admin Control
-- This script fixes "record 'new' has no field 'updated_at'" and ensures all V3 columns are present.

DO $$ 
BEGIN
    -- 1. HARDEN THE TRIGGER FUNCTION FIRST
    -- This prevents the "no field updated_at" error from ever happening again.
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $body$
    BEGIN
        BEGIN
            NEW.updated_at = NOW();
        EXCEPTION WHEN undefined_column THEN
            -- If the column doesn't exist, just move on instead of crashing the update
            RETURN NEW;
        END;
        RETURN NEW;
    END;
    $body$ language 'plpgsql';

    -- 2. ENSURE ALL COLUMNS EXIST ON CHEFS
    -- Core Identity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='name') THEN
        ALTER TABLE chefs ADD COLUMN "name" TEXT DEFAULT 'Chef';
    END IF;
    
    -- V3 Metadata
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='onboarding_status') THEN
        ALTER TABLE chefs ADD COLUMN onboarding_status TEXT DEFAULT 'pending_verification';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='experience_level') THEN
        -- Ensure type exists if we added it in a previous migration
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chef_experience_level') THEN
            CREATE TYPE chef_experience_level AS ENUM ('beginner', 'intermediate', 'experienced', 'expert');
        END IF;
        ALTER TABLE chefs ADD COLUMN experience_level chef_experience_level DEFAULT 'experienced';
    END IF;

    -- TIMESTAMPS (Critical for triggers)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='updated_at') THEN
        ALTER TABLE chefs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='created_at') THEN
        ALTER TABLE chefs ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- LOCATION (Causes "city" and "address" errors)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='city') THEN
        ALTER TABLE chefs ADD COLUMN city TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='address') THEN
        ALTER TABLE chefs ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='state') THEN
        ALTER TABLE chefs ADD COLUMN state TEXT;
    END IF;

    -- 3. FIX RLS POLICIES FOR ADMIN UPDATES
    -- Ensure the modern 'is_admin()' works or provide a direct fallback for the JWT role.
    DROP POLICY IF EXISTS "Admins can update any chef" ON chefs;
    CREATE POLICY "Admins can update any chef"
      ON chefs FOR UPDATE
      USING (
        (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
      );

END $$;

-- 4. ENSURE PERFORMANCE METRICS TABLE HAS UPDATED_AT
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chef_performance_metrics' AND column_name='updated_at') THEN
        ALTER TABLE chef_performance_metrics ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 5. RELOAD EVERYTHING
NOTIFY pgrst, 'reload schema';
