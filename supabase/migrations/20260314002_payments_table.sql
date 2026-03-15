-- =============================================================================
-- Foodie Payment System — Migration 002
-- Create payments table (client_charge, prep_advance, final_payout)
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_type    TEXT NOT NULL
                  CHECK (payment_type IN ('client_charge', 'prep_advance', 'final_payout')),
  provider        TEXT NOT NULL DEFAULT 'paystack',
  provider_ref    TEXT UNIQUE,
  amount          NUMERIC(10,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'KES',
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'success', 'failed', 'reversed')),
  raw_payload     JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_ref ON payments(provider_ref);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_type ON payments(payment_type);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ── Row Level Security ────────────────────────────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Clients see their own payment records
CREATE POLICY "client_own_payments" ON payments FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE client_id = auth.uid()
    )
  );

-- Chefs see payments related to their bookings
CREATE POLICY "chef_own_payments" ON payments FOR SELECT
  USING (
    booking_id IN (
      SELECT id FROM bookings WHERE current_chef_id IN (
        SELECT id FROM chefs WHERE user_id = auth.uid()
      )
    )
  );

-- Admins can see all payments
CREATE POLICY "admin_all_payments" ON payments FOR ALL
  USING (
    is_admin()
  ) WITH CHECK (
    is_admin()
  );

NOTIFY pgrst, 'reload schema';
