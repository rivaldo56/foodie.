-- Migration: Fix RLS violation on chef_performance_metrics
-- 1. Update trigger function to SECURITY DEFINER to bypass RLS during automatic insertion
CREATE OR REPLACE FUNCTION create_chef_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chef_performance_metrics (chef_id)
  VALUES (NEW.id)
  ON CONFLICT (chef_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure RLS is enabled but allows the trigger/service role to operate
ALTER TABLE chef_performance_metrics ENABLE ROW LEVEL SECURITY;

-- 3. Add an explicit policy for admins to manage it if needed
CREATE POLICY "Admins can manage metrics"
  ON chef_performance_metrics FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4. Reload schema cache just in case
NOTIFY pgrst, 'reload schema';
