-- Add meal_id to bookings table to support individual meal booking
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS meal_id UUID REFERENCES meals(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_meal_id ON bookings(meal_id);

-- Update RLS policies to allow checking meal_id (inherited from existing policies)
-- The existing "Public can view active meals" and "Users can create bookings" 
-- should already cover the basics, but let's ensure consistency.

COMMENT ON COLUMN bookings.meal_id IS 'References a specific meal when booked individually, outside of a menu.';
