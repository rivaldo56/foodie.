-- =============================================================================
-- Foodie Payment System — Migration 001
-- Add Paystack payment columns to bookings + extend chefs table
-- =============================================================================

-- ── 1. Extend bookings table with Paystack payment fields ─────────────────────
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS total_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prep_advance_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_payout_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_chef_id      UUID REFERENCES chefs(id),
  ADD COLUMN IF NOT EXISTS paystack_ref         TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS prep_sent_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_rating        INTEGER CHECK (client_rating BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS client_review        TEXT,
  ADD COLUMN IF NOT EXISTS event_date           DATE;

-- ── 2. Add new booking statuses ───────────────────────────────────────────────
-- The existing booking_status ENUM has: pending, confirmed, in_progress, completed, canceled
-- Add the new dispatch-cycle statuses (IF NOT EXISTS guard via DO block)
DO $$
BEGIN
  -- paid: payment confirmed, dispatch not yet started
  BEGIN ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'paid'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  -- dispatching: dispatch engine running
  BEGIN ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'dispatching'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  -- awaiting_chef: specific chef notified, waiting for response
  BEGIN ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'awaiting_chef'; EXCEPTION WHEN duplicate_object THEN NULL; END;
  -- no_chef_found: all chefs exhausted
  BEGIN ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'no_chef_found'; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;

-- ── 3. Extend chefs table with Paystack + operational fields ──────────────────
ALTER TABLE chefs
  ADD COLUMN IF NOT EXISTS paystack_subaccount_code TEXT,
  ADD COLUMN IF NOT EXISTS paystack_recipient_code   TEXT,
  ADD COLUMN IF NOT EXISTS phone                     TEXT,
  ADD COLUMN IF NOT EXISTS avg_rating                NUMERIC(3,2) DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS is_active                 BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_verified               BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS total_bookings_completed  INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_dispatched          INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_accepted            INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cuisine_tags              TEXT[] DEFAULT '{}';

-- ── 4. Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_paystack_ref ON bookings(paystack_ref);
CREATE INDEX IF NOT EXISTS idx_bookings_current_chef_id ON bookings(current_chef_id);
CREATE INDEX IF NOT EXISTS idx_chefs_is_active ON chefs(is_active);
CREATE INDEX IF NOT EXISTS idx_chefs_is_verified ON chefs(is_verified);
CREATE INDEX IF NOT EXISTS idx_chefs_paystack_recipient ON chefs(paystack_recipient_code);

NOTIFY pgrst, 'reload schema';
