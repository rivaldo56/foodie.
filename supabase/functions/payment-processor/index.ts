import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { hmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts';

// ──────────────────────────────────────────────────────────────────────────────
// Environment
// ──────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_WEBHOOK_SECRET = Deno.env.get('PAYSTACK_WEBHOOK_SECRET') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ──────────────────────────────────────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const rawBody = await req.text();

    // ── Verify Paystack webhook signature ──────────────────────────────────
    if (PAYSTACK_WEBHOOK_SECRET) {
      const signature = req.headers.get('x-paystack-signature') ?? '';
      const expectedSig = await computeHmacSha512(PAYSTACK_WEBHOOK_SECRET, rawBody);
      if (signature !== expectedSig) {
        console.warn('[payment-processor] Invalid webhook signature');
        return new Response('Unauthorized', { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    console.log('[payment-processor] Event received:', event.event, event.data?.reference);

    if (event.event === 'charge.success') {
      await handleChargeSuccess(supabase, event.data);
    } else if (event.event === 'charge.failed') {
      await handleChargeFailed(supabase, event.data);
    } else if (event.event === 'transfer.success') {
      await handleTransferSuccess(supabase, event.data);
    } else if (event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      await handleTransferFailed(supabase, event.data);
    } else {
      console.log('[payment-processor] Unhandled event:', event.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[payment-processor] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Handle successful charge (deposit or remainder)
// ──────────────────────────────────────────────────────────────────────────────
async function handleChargeSuccess(
  supabase: ReturnType<typeof createClient>,
  data: Record<string, any>,
) {
  const reference: string = data.reference ?? '';
  const amountPaid = (data.amount ?? 0) / 100; // convert from kobo/cents to KES
  const paidAt = new Date().toISOString();

  // Determine payment type from reference prefix
  const isDeposit = reference.startsWith('deposit_');
  const isRemainder = reference.startsWith('remainder_');

  if (!isDeposit && !isRemainder) {
    console.warn('[payment-processor] Unknown reference pattern:', reference);
    return;
  }

  // Extract booking_id from reference: deposit_{uuid} or remainder_{uuid}
  const bookingId = reference.split('_').slice(1).join('_');

  const { data: escrow, error: escrowErr } = await supabase
    .from('escrow_transactions')
    .select('id, booking_id, escrow_status')
    .eq('booking_id', bookingId)
    .single();

  if (escrowErr || !escrow) {
    console.error('[payment-processor] Escrow not found for booking:', bookingId);
    return;
  }

  if (isDeposit) {
    // Update escrow and booking for deposit payment
    await supabase
      .from('escrow_transactions')
      .update({ deposit_paid_at: paidAt })
      .eq('booking_id', bookingId);

    await supabase
      .from('bookings')
      .update({
        deposit_paid_at: paidAt,
        escrow_status: 'held',
      })
      .eq('id', bookingId);

    console.log(`[payment-processor] Deposit paid for booking: ${bookingId}, amount: ${amountPaid}`);

  } else if (isRemainder) {
    // Full payment received
    await supabase
      .from('escrow_transactions')
      .update({
        remainder_paid_at: paidAt,
        remainder_ref: reference,
      })
      .eq('booking_id', bookingId);

    await supabase
      .from('bookings')
      .update({ fully_paid_at: paidAt })
      .eq('id', bookingId);

    console.log(`[payment-processor] Remainder paid for booking: ${bookingId}, amount: ${amountPaid}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Handle failed charge
// ──────────────────────────────────────────────────────────────────────────────
async function handleChargeFailed(
  supabase: ReturnType<typeof createClient>,
  data: Record<string, any>,
) {
  const reference: string = data.reference ?? '';
  const bookingId = reference.split('_').slice(1).join('_');

  console.warn(`[payment-processor] Charge failed for booking: ${bookingId}`, data.gateway_response);

  // If deposit failed, keep booking in current state – client needs to retry
  // Optionally notify client via Realtime
  await supabase.channel(`client:${bookingId}`).send({
    type: 'broadcast',
    event: 'payment_failed',
    payload: {
      booking_id: bookingId,
      reason: data.gateway_response ?? 'Payment failed. Please try again.',
    },
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Handle successful transfer (chef payout)
// ──────────────────────────────────────────────────────────────────────────────
async function handleTransferSuccess(
  supabase: ReturnType<typeof createClient>,
  data: Record<string, any>,
) {
  const reference: string = data.reference ?? data.transfer_code ?? '';
  const completedAt = new Date().toISOString();

  // Update chef payout record
  const { error } = await supabase
    .from('chef_payouts')
    .update({
      status: 'paid',
      payout_reference: reference,
      completed_at: completedAt,
    })
    .eq('payout_reference', reference);

  if (error) {
    console.error('[payment-processor] Payout update failed:', error);
    return;
  }

  // Find associated booking and mark as paid_out
  const { data: payout } = await supabase
    .from('chef_payouts')
    .select('booking_id')
    .eq('payout_reference', reference)
    .single();

  if (payout?.booking_id) {
    await supabase
      .from('bookings')
      .update({ status: 'paid_out' })
      .eq('id', payout.booking_id);
  }

  console.log('[payment-processor] Payout completed:', reference);
}

// ──────────────────────────────────────────────────────────────────────────────
// Handle failed / reversed transfer
// ──────────────────────────────────────────────────────────────────────────────
async function handleTransferFailed(
  supabase: ReturnType<typeof createClient>,
  data: Record<string, any>,
) {
  const reference: string = data.reference ?? data.transfer_code ?? '';
  console.error('[payment-processor] Transfer failed/reversed:', reference);

  await supabase
    .from('chef_payouts')
    .update({
      status: 'failed',
      failure_reason: data.gateway_response ?? 'Transfer failed',
    })
    .eq('payout_reference', reference);
}

// ──────────────────────────────────────────────────────────────────────────────
// HMAC-SHA512 signature verification for Paystack
// ──────────────────────────────────────────────────────────────────────────────
async function computeHmacSha512(secret: string, payload: string): Promise<string> {
  const key = new TextEncoder().encode(secret);
  const message = new TextEncoder().encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
