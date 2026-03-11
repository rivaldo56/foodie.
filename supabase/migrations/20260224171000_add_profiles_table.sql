-- Migration: Create public profiles table for client visibility
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to sync from auth.users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'Guest User'),
    NEW.email,
    NEW.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Backfill existing users
INSERT INTO public.profiles (id, full_name, email, avatar_url)
SELECT
  id,
  COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', 'Guest'),
  email,
  raw_user_meta_data ->> 'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Explicitly link bookings to profiles for PostgREST relationship discovery
ALTER TABLE bookings 
  DROP CONSTRAINT IF EXISTS bookings_client_id_fkey,
  ADD CONSTRAINT bookings_client_id_fkey 
  FOREIGN KEY (client_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Reload cache
NOTIFY pgrst, 'reload schema';
