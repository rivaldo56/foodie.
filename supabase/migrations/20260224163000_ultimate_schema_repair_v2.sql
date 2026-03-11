-- ULTIMATE REPAIR V2: Ensure ALL V3 columns exist on chefs table and reload cache
DO $$ 
BEGIN
    -- Core Identity & Bio
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='name') THEN
        ALTER TABLE chefs ADD COLUMN "name" TEXT DEFAULT 'Chef';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='bio') THEN
        ALTER TABLE chefs ADD COLUMN bio TEXT;
    END IF;

    -- Location
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='city') THEN
        ALTER TABLE chefs ADD COLUMN city TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='state') THEN
        ALTER TABLE chefs ADD COLUMN state TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='address') THEN
        ALTER TABLE chefs ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='zip_code') THEN
        ALTER TABLE chefs ADD COLUMN zip_code TEXT;
    END IF;

    -- V3 Metrics & Logic
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='per_guest_rate') THEN
        ALTER TABLE chefs ADD COLUMN per_guest_rate DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='base_booking_fee') THEN
        ALTER TABLE chefs ADD COLUMN base_booking_fee DECIMAL(10,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='travel_radius_km') THEN
        ALTER TABLE chefs ADD COLUMN travel_radius_km INTEGER DEFAULT 30;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='onboarding_status') THEN
        ALTER TABLE chefs ADD COLUMN onboarding_status TEXT DEFAULT 'pending_verification';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chefs' AND column_name='cuisine_specialties') THEN
        ALTER TABLE chefs ADD COLUMN cuisine_specialties TEXT[] DEFAULT '{}';
    END IF;

END $$;

-- FORCE SCHEMA CACHE RELOAD
NOTIFY pgrst, 'reload schema';
