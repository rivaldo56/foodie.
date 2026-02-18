-- Synchronize experience_category enum with UI options
-- The UI offers several categories that were missing from the initial schema enum

-- ALTER TYPE ... ADD VALUE cannot be executed in a transaction block in some Postgres versions.
-- Supabase migrations run in transactions, so we use this block to safely add them if they don't exist.
-- Note: Postgres 12+ supports ADD VALUE in a transaction if the value is not used in the same transaction.

DO $$
BEGIN
    -- Core missing categories from user's latest list
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'experience_category' AND e.enumlabel = 'chama') THEN
        ALTER TYPE experience_category ADD VALUE 'chama';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'experience_category' AND e.enumlabel = 'birthday') THEN
        ALTER TYPE experience_category ADD VALUE 'birthday';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'experience_category' AND e.enumlabel = 'corporate_party') THEN
        ALTER TYPE experience_category ADD VALUE 'corporate_party';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'experience_category' AND e.enumlabel = 'anniversary') THEN
        ALTER TYPE experience_category ADD VALUE 'anniversary';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'experience_category' AND e.enumlabel = 'baby_shower') THEN
        ALTER TYPE experience_category ADD VALUE 'baby_shower';
    END IF;
END
$$;

COMMENT ON TYPE experience_category IS 'Extended categories for curated dining experiences to match UI options.';
