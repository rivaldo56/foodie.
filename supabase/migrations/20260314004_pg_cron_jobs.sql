-- =============================================================================
-- Foodie Payment System — Migration 004
-- pg_cron jobs for SLA timeout checker and 24h auto-completion
-- =============================================================================
-- Pre-requisite: pg_cron extension must be enabled in Supabase
-- Enable via: Supabase Dashboard > Database > Extensions > pg_cron
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ── Job 1: SLA timeout checker (runs every 5 minutes) ─────────────────────────
-- Finds dispatch_attempts that are 'pending' and past their expires_at,
-- marks them 'timed_out', and updates the booking back to 'dispatching'
-- so the dispatch-booking edge function knows to try the next chef.
SELECT cron.unschedule('dispatch-sla-timeout');
SELECT cron.schedule(
  'dispatch-sla-timeout',
  '*/5 * * * *',
  $$
  UPDATE dispatch_attempts
  SET status = 'timed_out'
  WHERE status = 'pending'
    AND expires_at < NOW();

  -- Mark corresponding bookings as 'dispatching' so the webhook/cron
  -- can identify them for re-dispatch on next cycle
  UPDATE bookings
  SET status = 'dispatching'
  WHERE status = 'awaiting_chef'
    AND id IN (
      SELECT DISTINCT booking_id
      FROM dispatch_attempts
      WHERE status = 'timed_out'
        AND expires_at >= NOW() - INTERVAL '6 minutes'
    );
  $$
);

-- ── Job 2: 24h auto-completion (runs nightly at 02:00 EAT = 23:00 UTC) ────────
-- Auto-completes bookings where:
--   - status is 'confirmed' or 'in_progress'
--   - event date (date_time) has passed by more than 24 hours
-- This triggers the final payout via the complete-booking edge function
SELECT cron.unschedule('auto-completion-24h');
SELECT cron.schedule(
  'auto-completion-24h',
  '0 23 * * *',
  $$
  UPDATE bookings
  SET
    status = 'completed',
    completed_at = NOW()
  WHERE status IN ('confirmed', 'in_progress')
    AND date_time < NOW() - INTERVAL '24 hours'
    AND completed_at IS NULL;
  $$
);

-- ── Verify jobs are registered ──────────────────────────────────────────────
-- SELECT * FROM cron.job WHERE jobname IN ('dispatch-sla-timeout', 'auto-completion-24h');
