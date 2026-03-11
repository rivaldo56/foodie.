-- FINAL REPAIR: Fix missing booking location columns
-- Migration: 20260224181000_repair_booking_columns.sql

DO $$ 
BEGIN
    -- Add missing address components to bookings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='city') THEN
        ALTER TABLE bookings ADD COLUMN city TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='state') THEN
        ALTER TABLE bookings ADD COLUMN state TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='zip_code') THEN
        ALTER TABLE bookings ADD COLUMN zip_code TEXT;
    END IF;(base) rivaldo@rivaldo-HP-ProBook-430-G3:~/codes/foodie-serverless/foodie-v2$ npx supabase functions deploy escrow-release-manager

    -- Ensure V3 columns are also present (Safety Check)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='experience_type') THEN
        ALTER TABLE bookings ADD COLUMN experience_type TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='sla_expires_at') THEN
        ALTER TABLE bookings ADD COLUMN sla_expires_at TIMESTAMPTZ;
    END IF;

END $$;

-- Reload postgrest schema
NOTIFY pgrst, 'reload schema';
