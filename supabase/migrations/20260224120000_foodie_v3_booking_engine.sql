-- =============================================================================
-- Foodie V3 – Demand-Led Booking & Chef Execution Engine
-- Migration: 20260224120000_foodie_v3_booking_engine.sql
-- =============================================================================

-- =============================================================================
-- 1. EXTEND booking_status ENUM
-- =============================================================================
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'rotating';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'assigned';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_client_confirmation';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payout_processing';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'paid_out';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'disputed';

-- =============================================================================
-- 2. ADD V3 COLUMNS TO bookings
-- =============================================================================
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_model TEXT DEFAULT 'full_digital'
       CHECK (payment_model IN ('full_digital', 'cash_balance')),
  ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS deposit_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fully_paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rotation_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'none'
       CHECK (escrow_status IN ('none', 'held', 'released', 'refunded', 'frozen')),
  ADD COLUMN IF NOT EXISTS chef_queue JSONB DEFAULT '[]',        -- ordered array of chef UUIDs for rotation
  ADD COLUMN IF NOT EXISTS decline_reason TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS confirmed_by_client_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS experience_type TEXT;

COMMENT ON COLUMN bookings.chef_queue IS 'Ordered list of chef UUIDs for SLA rotation. Managed by booking-manager edge function.';
COMMENT ON COLUMN bookings.rotation_count IS 'How many chefs have been tried (declined or SLA expired) for this booking.';
COMMENT ON COLUMN bookings.escrow_status IS 'Payment escrow lifecycle state.';

CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_sla_expires_at ON bookings(sla_expires_at) WHERE sla_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_escrow_status ON bookings(escrow_status);

-- =============================================================================
-- 3. ADD V3 FIELDS TO chefs
-- =============================================================================
ALTER TABLE chefs
  ADD COLUMN IF NOT EXISTS per_guest_rate DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS base_booking_fee DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_tolerance TEXT DEFAULT 'moderate'
       CHECK (cancellation_tolerance IN ('strict', 'moderate', 'flexible')),
  ADD COLUMN IF NOT EXISTS payout_method TEXT DEFAULT 'mpesa'
       CHECK (payout_method IN ('mpesa', 'bank', 'paystack')),
  ADD COLUMN IF NOT EXISTS payout_reference TEXT,       -- MPesa number / bank account ref
  ADD COLUMN IF NOT EXISTS service_types TEXT[] DEFAULT '{}',   -- e.g. ['private_dining','catering']
  ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending_verification'
       CHECK (onboarding_status IN ('pending_verification', 'approved', 'suspended')),
  ADD COLUMN IF NOT EXISTS travel_radius_km INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS equipment_capabilities TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cuisine_specialties TEXT[] DEFAULT '{}';

COMMENT ON COLUMN chefs.onboarding_status IS 'Chef must be approved before receiving booking requests.';



CREATE INDEX IF NOT EXISTS idx_chefs_onboarding_status ON chefs(onboarding_status);
CREATE INDEX IF NOT EXISTS idx_chefs_service_types ON chefs USING GIN(service_types);
CREATE INDEX IF NOT EXISTS idx_chefs_cuisine_specialties ON chefs USING GIN(cuisine_specialties);

-- =============================================================================
-- 4. chef_availability TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS chef_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chef_id UUID NOT NULL REFERENCES chefs(id) ON DELETE CASCADE,
  -- type: 'blocked' = unavailable, 'available' = explicit open slot, 'recurring' = weekly rule
  type TEXT NOT NULL CHECK (type IN ('blocked', 'available', 'recurring')),
  -- For explicit date blocks / open slots
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  -- For recurring weekly rules
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  available_from TIME,
  available_until TIME,
  -- Optional: restrict rule to a specific service type
  service_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chef_availability_chef_id ON chef_availability(chef_id);
CREATE INDEX IF NOT EXISTS idx_chef_availability_type ON chef_availability(type);
CREATE INDEX IF NOT EXISTS idx_chef_availability_start_end ON chef_availability(start_at, end_at);

CREATE TRIGGER update_chef_availability_updated_at
  BEFORE UPDATE ON chef_availability
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================================================
-- 5. escrow_transactions TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL,
  remaining_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  escrow_status TEXT NOT NULL DEFAULT 'held'
       CHECK (escrow_status IN ('held', 'released', 'refunded', 'frozen')),
  deposit_ref TEXT,         -- Paystack transaction reference for the 30% deposit
  remainder_ref TEXT,       -- Paystack transaction reference for the 70% remainder
  deposit_paid_at TIMESTAMPTZ,
  remainder_paid_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_escrow_booking_id ON escrow_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transactions(escrow_status);

CREATE TRIGGER update_escrow_transactions_updated_at
  BEFORE UPDATE ON escrow_transactions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =============================================================================
-- 6. chef_payouts TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS chef_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  chef_id UUID NOT NULL REFERENCES chefs(id),
  gross_amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  net_amount DECIMAL(10,2) NOT NULL,
  payout_method TEXT NOT NULL,
  payout_reference TEXT,          -- MPesa transaction ID / bank ref
  status TEXT NOT NULL DEFAULT 'pending'
       CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  initiated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_chef_payouts_chef_id ON chef_payouts(chef_id);
CREATE INDEX IF NOT EXISTS idx_chef_payouts_booking_id ON chef_payouts(booking_id);
CREATE INDEX IF NOT EXISTS idx_chef_payouts_status ON chef_payouts(status);

-- =============================================================================
-- 7. chef_performance_metrics TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS chef_performance_metrics (
  chef_id UUID PRIMARY KEY REFERENCES chefs(id) ON DELETE CASCADE,
  avg_response_time_seconds DECIMAL(10,2) DEFAULT 0,
  cancellation_rate DECIMAL(5,4) DEFAULT 0,   -- 0.0000 to 1.0000
  acceptance_rate DECIMAL(5,4) DEFAULT 1.0,
  rotation_priority_score DECIMAL(10,4) DEFAULT 100, -- higher = preferred in rotation
  total_jobs_received INTEGER DEFAULT 0,
  total_jobs_accepted INTEGER DEFAULT 0,
  total_jobs_cancelled INTEGER DEFAULT 0,
  total_sla_misses INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chef_metrics_priority ON chef_performance_metrics(rotation_priority_score DESC);

-- Auto-insert metrics row when a chef is created
CREATE OR REPLACE FUNCTION create_chef_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chef_performance_metrics (chef_id)
  VALUES (NEW.id)
  ON CONFLICT (chef_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_chef_metrics
  AFTER INSERT ON chefs
  FOR EACH ROW EXECUTE PROCEDURE create_chef_performance_metrics();

-- Back-fill metrics for existing chefs
INSERT INTO chef_performance_metrics (chef_id)
SELECT id FROM chefs
ON CONFLICT (chef_id) DO NOTHING;

-- =============================================================================
-- 8. FUNCTION: recalculate_chef_priority_score
-- Called after each booking action to keep the rotation score current.
-- Score formula: acceptance_rate * 60 + (1 - cancellation_rate) * 30
--                + (1 / GREATEST(avg_response_time_seconds / 60, 1)) * 10
-- =============================================================================
CREATE OR REPLACE FUNCTION recalculate_chef_priority_score(p_chef_id UUID)
RETURNS void AS $$
DECLARE
  m chef_performance_metrics%ROWTYPE;
BEGIN
  SELECT * INTO m FROM chef_performance_metrics WHERE chef_id = p_chef_id;
  IF NOT FOUND THEN RETURN; END IF;

  UPDATE chef_performance_metrics
  SET
    rotation_priority_score =
      (m.acceptance_rate * 60)
      + ((1 - m.cancellation_rate) * 30)
      + (10.0 / GREATEST(m.avg_response_time_seconds / 60.0, 1.0)),
    updated_at = NOW()
  WHERE chef_id = p_chef_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 9. RLS POLICIES – new tables
-- =============================================================================

-- chef_availability
ALTER TABLE chef_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chef can manage own availability"
  ON chef_availability FOR ALL
  USING (
    EXISTS (SELECT 1 FROM chefs WHERE id = chef_availability.chef_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM chefs WHERE id = chef_availability.chef_id AND user_id = auth.uid())
  );

CREATE POLICY "Public can view chef availability"
  ON chef_availability FOR SELECT
  USING (true);

-- escrow_transactions
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Client can view own escrow"
  ON escrow_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = escrow_transactions.booking_id
        AND bookings.client_id = auth.uid()
    )
  );

CREATE POLICY "Chef can view escrow for assigned bookings"
  ON escrow_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      JOIN chefs c ON c.id = b.chef_id
      WHERE b.id = escrow_transactions.booking_id
        AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all escrow"
  ON escrow_transactions FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- chef_payouts
ALTER TABLE chef_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Chef can view own payouts"
  ON chef_payouts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM chefs WHERE id = chef_payouts.chef_id AND user_id = auth.uid())
  );

CREATE POLICY "Admins can view all payouts"
  ON chef_payouts FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- chef_performance_metrics
ALTER TABLE chef_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view metrics"
  ON chef_performance_metrics FOR SELECT
  USING (true);

CREATE POLICY "Chef can view own metrics"
  ON chef_performance_metrics FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM chefs WHERE id = chef_performance_metrics.chef_id AND user_id = auth.uid())
  );

-- Allow bookings to be updated by chefs (for SLA accept/decline)
-- Chefs can only update status on bookings assigned to them
CREATE POLICY "Chefs can update assigned booking status"
  ON bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chefs WHERE id = bookings.chef_id AND user_id = auth.uid()
    )
  );

-- Admins can update any booking
CREATE POLICY "Admins can update any booking"
  ON bookings FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
