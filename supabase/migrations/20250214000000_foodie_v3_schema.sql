-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enum Types
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'in_progress', 'completed', 'canceled');
CREATE TYPE experience_category AS ENUM ('private_dinner', 'meal_prep', 'event_catering', 'cooking_class', 'other');
CREATE TYPE chef_experience_level AS ENUM ('beginner', 'intermediate', 'experienced', 'expert');

-- 1. Create experiences table
CREATE TABLE IF NOT EXISTS experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category experience_category NOT NULL DEFAULT 'other',
    image_url TEXT,
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create menus table
CREATE TABLE IF NOT EXISTS menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    experience_id UUID REFERENCES experiences(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price_per_person DECIMAL(10, 2) NOT NULL,
    guest_min INTEGER DEFAULT 1,
    guest_max INTEGER DEFAULT 100,
    dietary_tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create chefs table
-- We link to auth.users but also allow a separate ID if needed, but for simplicity let's use a separate ID and link user_id
CREATE TABLE IF NOT EXISTS chefs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Optional: Link to Supabase Auth User
    name TEXT NOT NULL,
    portfolio_url TEXT,
    verified BOOLEAN DEFAULT false,
    availability_schedule JSONB DEFAULT '{}',
    bio TEXT,
    specialties TEXT[],
    experience_level chef_experience_level DEFAULT 'experienced',
    hourly_rate DECIMAL(10, 2),
    service_radius INTEGER, -- in km
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_id UNIQUE (user_id)
);

-- 4. Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_admin_user_id UNIQUE (user_id)
);

-- 5. Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Client who booked
    menu_id UUID REFERENCES menus(id) ON DELETE SET NULL,
    chef_id UUID REFERENCES chefs(id) ON DELETE SET NULL,
    date_time TIMESTAMPTZ NOT NULL,
    address TEXT NOT NULL,
    guests_count INTEGER NOT NULL,
    status booking_status DEFAULT 'pending',
    total_price DECIMAL(10, 2) NOT NULL,
    special_requests TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_menus_experience_id ON menus(experience_id);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_chef_id ON bookings(chef_id);
CREATE INDEX IF NOT EXISTS idx_bookings_menu_id ON bookings(menu_id);
CREATE INDEX IF NOT EXISTS idx_chefs_user_id ON chefs(user_id);

-- Row Level Security (RLS)

-- Enable RLS
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE chefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for EXPERIENCES
-- Everyone can view experiences
CREATE POLICY "Public experiences are viewable by everyone"
ON experiences FOR SELECT
USING (true);

-- Only admins can insert/update/delete experiences
CREATE POLICY "Admins can insert experiences"
ON experiences FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update experiences"
ON experiences FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete experiences"
ON experiences FOR DELETE
USING (is_admin());

-- Policies for MENUS
-- Everyone can view menus
CREATE POLICY "Public menus are viewable by everyone"
ON menus FOR SELECT
USING (true);

-- Only admins can insert/update/delete menus
CREATE POLICY "Admins can insert menus"
ON menus FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update menus"
ON menus FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete menus"
ON menus FOR DELETE
USING (is_admin());

-- Policies for CHEFS
-- Everyone can view verified chefs (or all chefs?) - Let's allow viewing all for now
CREATE POLICY "Chefs are viewable by everyone"
ON chefs FOR SELECT
USING (true);

-- Chefs can update their own profile
CREATE POLICY "Chefs can update own profile"
ON chefs FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can update any chef
CREATE POLICY "Admins can update any chef"
ON chefs FOR UPDATE
USING (is_admin());

-- Policies for BOOKINGS
-- Clients can view their own bookings
CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = client_id);

-- Chefs can view bookings assigned to them
-- We need to check if the current user is the chef assigned to the booking
CREATE POLICY "Chefs can view assigned bookings"
ON bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM chefs WHERE id = bookings.chef_id AND user_id = auth.uid()
  )
);

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON bookings FOR SELECT
USING (is_admin());

-- Clients can create bookings (for themselves)
CREATE POLICY "Users can create bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = client_id);

-- Policies for ADMIN_USERS
-- Only admins (or service role) can view admin users
CREATE POLICY "Admins can view admin users"
ON admin_users FOR SELECT
USING (is_admin());

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_experiences_updated_at BEFORE UPDATE ON experiences FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_menus_updated_at BEFORE UPDATE ON menus FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_chefs_updated_at BEFORE UPDATE ON chefs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
