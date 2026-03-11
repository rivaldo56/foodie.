-- Migration: Allow chefs to view their own metrics
CREATE POLICY "Chefs can view own metrics"
  ON chef_performance_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chefs
      WHERE id = chef_performance_metrics.chef_id
      AND user_id = auth.uid()
    )
  );

-- Reload cache
NOTIFY pgrst, 'reload schema';
