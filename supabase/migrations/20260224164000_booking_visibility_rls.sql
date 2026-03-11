-- Migration: Improve booking visibility for chefs
-- Allowing chefs to see bookings where they are the current assigned chef OR in the candidate queue.

-- 1. DROP old visibility policy if it exists (usually it's base on chef_id)
-- 2. CREATE new robust policy
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Chefs can view assigned bookings" ON bookings;
    DROP POLICY IF EXISTS "Chefs can view bookings in their queue" ON bookings;
END $$;

CREATE POLICY "Chefs can view bookings in their queue"
  ON bookings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chefs
      WHERE chefs.user_id = auth.uid()
      AND (
        bookings.chef_id = chefs.id 
        OR 
        bookings.chef_queue @> jsonb_build_array(chefs.id::text)
      )
    )
  );

-- 3. Ensure RLS is enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- 4. Reload cache
NOTIFY pgrst, 'reload schema';
