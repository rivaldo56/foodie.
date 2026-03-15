-- =============================================================================
-- Foodie Payment System — Migration 003
-- Create dispatch_attempts table for chef dispatch cascade tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS dispatch_attempts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  chef_id      UUID NOT NULL REFERENCES chefs(id),
  attempt_num  INTEGER NOT NULL DEFAULT 1,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted', 'declined', 'timed_out')),
  notified_at  TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dispatch_booking_id ON dispatch_attempts(booking_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_chef_id ON dispatch_attempts(chef_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_status ON dispatch_attempts(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_expires_at ON dispatch_attempts(expires_at)
  WHERE status = 'pending';

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE dispatch_attempts ENABLE ROW LEVEL SECURITY;

-- Chefs see their own dispatch attempts
CREATE POLICY "chef_own_attempts" ON dispatch_attempts FOR SELECT
  USING (
    chef_id IN (
      SELECT id FROM chefs WHERE user_id = auth.uid()
    )
  );

-- Admins see all
CREATE POLICY "admin_all_attempts" ON dispatch_attempts FOR SELECT
  USING (
    is_admin()
  );

NOTIFY pgrst, 'reload schema';
