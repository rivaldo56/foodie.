import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ──────────────────────────────────────────────────────────────────────────────
// Environment
// ──────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const PLATFORM_COMMISSION_RATE = parseFloat(Deno.env.get('PLATFORM_COMMISSION_RATE') ?? '0.15');
// Hours after completion before auto-releasing escrow (default: 24h)
const ESCROW_HOLD_HOURS = parseInt(Deno.env.get('ESCROW_HOLD_HOURS') ?? '24', 10);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ──────────────────────────────────────────────────────────────────────────────
// Main handler
// Modes:
//  - GET /escrow-release-manager         → hourly scan (called by pg_cron)
//  - POST /escrow-release-manager        → manual trigger (admin or client confirm)
//    body: { booking_id, force?: boolean }
// ──────────────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (req.method === 'GET') {
      // Scheduled scan – process all eligible bookings
      const result = await runScheduledRelease(supabase);
      return json({ success: true, ...result });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      const { booking_id, force = false, admin_override = false } = body;

      if (!booking_id) return jsonError('Missing booking_id', 400);

      const result = await releaseEscrow(supabase, booking_id, { force, admin_override });
      return json({ success: true, ...result });
    }

    return jsonError('Method not allowed', 405);
  } catch (err) {
    console.error('[escrow-release-manager]', err);
    return jsonError('Internal server error', 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Scheduled scan: release escrow for all eligible bookings
// ──────────────────────────────────────────────────────────────────────────────
async function runScheduledRelease(supabase: ReturnType<typeof createClient>) {
  const cutoffTime = new Date(Date.now() - ESCROW_HOLD_HOURS * 60 * 60 * 1000).toISOString();

  // Find bookings that are:
  // 1. status = 'completed' AND completed_at > ESCROW_HOLD_HOURS ago
  // 2. escrow_status = 'held'
  // 3. Not already being processed
  const { data: eligibleBookings, error } = await supabase
    .from('bookings')
    .select('id, chef_id, total_price, payment_model, deposit_amount')
    .eq('status', 'completed')
    .eq('escrow_status', 'held')
    .lte('completed_at', cutoffTime);

  if (error) {
    console.error('[escrow-release-manager] Scan error:', error);
    return { processed: 0, failed: 0, error: error.message };
  }

  if (!eligibleBookings || eligibleBookings.length === 0) {
    console.log('[escrow-release-manager] No eligible bookings to process');
    return { processed: 0, failed: 0 };
  }

  console.log(`[escrow-release-manager] Processing ${eligibleBookings.length} bookings`);

  let processed = 0;
  let failed = 0;

  for (const booking of eligibleBookings) {
    try {
      await releaseEscrow(supabase, booking.id, { force: false, admin_override: false });
      processed++;
    } catch (err) {
      console.error(`[escrow-release-manager] Failed for booking ${booking.id}:`, err);
      failed++;
    }
  }

  return { processed, failed };
}

// ──────────────────────────────────────────────────────────────────────────────
// Core release logic for a single booking
// ──────────────────────────────────────────────────────────────────────────────
async function releaseEscrow(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  opts: { force: boolean; admin_override: boolean },
) {
  // Fetch booking + escrow
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select(`
      id, chef_id, total_price, payment_model, deposit_amount,
      status, escrow_status, completed_at, confirmed_by_client_at
    `)
    .eq('id', bookingId)
    .single();

  if (bookingErr || !booking) throw new Error(`Booking ${bookingId} not found`);

  const { data: escrow, error: escrowErr } = await supabase
    .from('escrow_transactions')
    .select('id, total_amount, deposit_amount, remaining_amount, platform_fee, escrow_status')
    .eq('booking_id', bookingId)
    .single();

  if (escrowErr || !escrow) throw new Error(`Escrow for booking ${bookingId} not found`);

  // Validate release conditions
  if (!opts.force && !opts.admin_override) {
    if (booking.status !== 'completed') {
      throw new Error(`Booking must be completed. Current status: ${booking.status}`);
    }
    if (escrow.escrow_status === 'frozen') {
      throw new Error('Escrow is frozen (disputed). Admin resolution required.');
    }
    if (escrow.escrow_status === 'released') {
      return { message: 'Escrow already released' };
    }

    const cutoffTime = new Date(Date.now() - ESCROW_HOLD_HOURS * 60 * 60 * 1000);
    const completedAt = new Date(booking.completed_at ?? 0);
    const clientConfirmed = booking.confirmed_by_client_at != null;

    if (!clientConfirmed && completedAt > cutoffTime) {
      throw new Error(`Escrow hold period not elapsed. Auto-release at: ${new Date(completedAt.getTime() + ESCROW_HOLD_HOURS * 3600000).toISOString()}`);
    }
  }

  // Calculate payout amounts
  // For cash_balance model: only the deposit (30%) was digital; commission from deposit only
  let grossAmount: number;
  let platformFee: number;

  if (booking.payment_model === 'cash_balance') {
    // Only digital portion goes through escrow
    grossAmount = Number(booking.deposit_amount ?? 0);
    platformFee = Math.round(grossAmount * PLATFORM_COMMISSION_RATE * 100) / 100;
  } else {
    // Full digital: commission from total
    grossAmount = Number(escrow.total_amount);
    platformFee = Number(escrow.platform_fee);
  }

  const netAmount = Math.round((grossAmount - platformFee) * 100) / 100;

  // Get chef payout details
  const { data: chef } = await supabase
    .from('chefs')
    .select('payout_method, payout_reference, name')
    .eq('id', booking.chef_id)
    .single();

  if (!chef) throw new Error(`Chef ${booking.chef_id} not found`);

  // Mark booking as payout_processing
  await supabase
    .from('bookings')
    .update({ status: 'payout_processing', escrow_status: 'released' })
    .eq('id', bookingId);

  // Update escrow record
  await supabase
    .from('escrow_transactions')
    .update({ escrow_status: 'released', released_at: new Date().toISOString() })
    .eq('booking_id', bookingId);

  // Create payout record
  const payoutRef = `payout_${bookingId}`;
  const { data: payoutRecord, error: payoutInsertErr } = await supabase
    .from('chef_payouts')
    .insert({
      booking_id: bookingId,
      chef_id: booking.chef_id,
      gross_amount: grossAmount,
      platform_fee: platformFee,
      net_amount: netAmount,
      payout_method: chef.payout_method,
      payout_reference: payoutRef,
      status: 'processing',
      initiated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (payoutInsertErr) {
    console.error('[escrow-release-manager] Payout insert error:', payoutInsertErr);
    throw new Error('Failed to create payout record');
  }

  // Execute payout via Paystack (if key configured)
  let paystackTransferRef: string | null = null;

  if (PAYSTACK_SECRET_KEY && chef.payout_method === 'paystack' && chef.payout_reference) {
    try {
      paystackTransferRef = await initiatePaystackPayout({
        recipientCode: chef.payout_reference,  // Paystack recipient code
        amount: netAmount,
        reference: payoutRef,
        reason: `Foodie payout - Booking ${bookingId}`,
      });

      // Update payout with Paystack transfer code
      await supabase
        .from('chef_payouts')
        .update({ payout_reference: paystackTransferRef })
        .eq('id', payoutRecord.id);

    } catch (payErr) {
      console.error('[escrow-release-manager] Paystack payout error:', payErr);
      await supabase
        .from('chef_payouts')
        .update({ 
          status: 'failed', 
          failure_reason: String(payErr),
        })
        .eq('id', payoutRecord.id);
      // Don't mark booking as paid_out – needs retry
      return {
        booking_id: bookingId,
        payout_id: payoutRecord.id,
        net_amount: netAmount,
        status: 'payout_failed',
        error: String(payErr),
      };
    }
  } else {
    // MPesa / bank – mark as pending manual execution
    // In production this would call SafariCom Daraja API or bank transfer API
    console.log(`[escrow-release-manager] MPesa payout pending for chef: ${chef.name}, amount: ${netAmount} KES`);
  }

  // Mark booking as paid_out (for Paystack; for MPesa we wait for webhook)
  if (chef.payout_method === 'paystack' && paystackTransferRef) {
    await supabase
      .from('bookings')
      .update({ status: 'paid_out' })
      .eq('id', bookingId);

    await supabase
      .from('chef_payouts')
      .update({ status: 'paid', completed_at: new Date().toISOString() })
      .eq('id', payoutRecord.id);
  }

  console.log(`[escrow-release-manager] Payout initiated for booking ${bookingId}: ${netAmount} KES → ${chef.name}`);

  return {
    booking_id: bookingId,
    payout_id: payoutRecord.id,
    gross_amount: grossAmount,
    platform_fee: platformFee,
    net_amount: netAmount,
    payout_method: chef.payout_method,
    paystack_transfer_ref: paystackTransferRef,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// Paystack transfer helper
// ──────────────────────────────────────────────────────────────────────────────
async function initiatePaystackPayout(opts: {
  recipientCode: string;
  amount: number;
  reference: string;
  reason: string;
}): Promise<string> {
  const res = await fetch('https://api.paystack.co/transfer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source: 'balance',
      amount: Math.round(opts.amount * 100), // kobo/cents
      recipient: opts.recipientCode,
      reason: opts.reason,
      reference: opts.reference,
      currency: 'KES',
    }),
  });

  const data = await res.json();
  if (!data.status) {
    throw new Error(`Paystack transfer failed: ${data.message}`);
  }

  return data.data.transfer_code;
}

// ── Response helpers ──────────────────────────────────────────────────────────
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number) {
  return json({ error: message }, status);
}
