-- Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert the founder code '#120021m'
-- We use pgcrypto's crypt function with Blowfish (bf) salt to generate a bcrypt-compatible hash.
-- This allows the Edge Function (using bcrypt) to verify it.

INSERT INTO public.founder_mode_codes (code_hash, expires_at, comment, is_active)
VALUES (
    crypt('#120021m', gen_salt('bf')),
    NOW() + INTERVAL '1 year', -- Code valid for 1 year
    'Primary Founder Code',
    true
);
