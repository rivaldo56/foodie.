import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ──────────────────────────────────────────────────────────────────────────────
// Environment
// ──────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_SECRET_KEY        = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const DISPATCH_FUNCTION_URL      = `${Deno.env.get('SUPABASE_URL')}/functions/v1/dispatch-booking`;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ──────────────────────────────────────────────────────────────────────────────
// Signature verification (HMAC-SHA512)
// ──────────────────────────────────────────────────────────────────────────────
async function verifyPaystackSignature(secret: string, body: string, sig: string): Promise<boolean> {
  const key     = new TextEncoder().encode(secret);
  const message = new TextEncoder().encode(body);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', key, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  const hash = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hash === sig;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const rawBody  = await req.text();
  const signature = req.headers.get('x-paystack-signature') ?? '';

  // ── Signature verification (reject anything invalid) ─────────────────────
  if (PAYSTACK_SECRET_KEY) {
    const valid = await verifyPaystackSignature(PAYSTACK_SECRET_KEY, rawBody, signature);
    if (!valid) {
      console.warn('[paystack-webhook] Invalid signature — rejecting request');
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Bad Request', { status: 400 });
  }

  console.log('[paystack-webhook] Event:', event.event, '| Ref:', event.data?.reference);

  try {
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(supabase, event.data);
        break;

      case 'transfer.success':
        await handleTransferSuccess(supabase, event.data);
        break;

      case 'transfer.failed':
      case 'transfer.reversed':
        await handleTransferFailed(supabase, event.data, event.event);
        break;

      default:
        console.log('[paystack-webhook] Ignored event:', event.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[paystack-webhook] Handler error:', err);
    // Still return 200 to prevent Paystack retrying for our internal errors
    return new Response(JSON.stringify({ received: true, internal_error: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// charge.success — client payment received
// ──────────────────────────────────────────────────────────────────────────────
async function handleChargeSuccess(supabase: any, data: Record<string, any>) {
  const reference: string = data.reference ?? '';

  // ── Idempotency: check if already processed ──────────────────────────────
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('provider_ref', reference)
    .eq('payment_type', 'client_charge')
    .single();

  if (existingPayment?.status === 'success') {
    console.log('[paystack-webhook] charge.success already processed for ref:', reference);
    return; // Idempotent — do nothing
  }

  // The reference is the booking.id (set by create-booking)
  const bookingId = reference;

  // ── Update payments row ──────────────────────────────────────────────────
  const { error: payErr } = await supabase
    .from('payments')
    .update({
      status:       'success',
      provider_ref: reference,
      raw_payload:  data,
    })
    .eq('booking_id', bookingId)
    .eq('payment_type', 'client_charge');

  if (payErr) {
    console.error('[paystack-webhook] payments update error:', payErr);
  }

  // ── Update booking status to 'paid' ──────────────────────────────────────
  const { error: bookingErr } = await supabase
    .from('bookings')
    .update({
      status:       'paid',
      escrow_status: 'held',
    })
    .eq('id', bookingId)
    .in('status', ['pending']); // Guard: only from pending state

  if (bookingErr) {
    console.error('[paystack-webhook] booking update error:', bookingErr);
  }

  console.log('[paystack-webhook] charge.success processed. Triggering dispatch for:', bookingId);

  // ── Trigger dispatch-booking asynchronously ───────────────────────────────
  try {
    await fetch(DISPATCH_FUNCTION_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ booking_id: bookingId }),
    });
  } catch (dispatchErr) {
    console.error('[paystack-webhook] Failed to call dispatch-booking:', dispatchErr);
    // Non-fatal: dispatch can be triggered manually or by pg_cron
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// transfer.success — prep advance or final payout sent to chef
// ──────────────────────────────────────────────────────────────────────────────
async function handleTransferSuccess(supabase: any, data: Record<string, any>) {
  const transferCode: string  = data.transfer_code ?? '';
  const reference: string     = data.reference ?? transferCode;
  const metadata: Record<string, any> = data.recipient?.metadata ?? data.metadata ?? {};

  // Identify payment type from reference prefix or metadata
  let paymentType: 'prep_advance' | 'final_payout' | null = null;
  let bookingId: string | null = null;

  if (reference.startsWith('prep_')) {
    paymentType = 'prep_advance';
    bookingId   = reference.replace('prep_', '');
  } else if (reference.startsWith('final_')) {
    paymentType = 'final_payout';
    bookingId   = reference.replace('final_', '');
  } else if (metadata.payment_type && metadata.booking_id) {
    paymentType = metadata.payment_type;
    bookingId   = metadata.booking_id;
  }

  if (!paymentType || !bookingId) {
    console.warn('[paystack-webhook] transfer.success: cannot identify payment type for ref:', reference);
    return;
  }

  // ── Idempotency check ─────────────────────────────────────────────────────
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('booking_id', bookingId)
    .eq('payment_type', paymentType)
    .single();

  if (existingPayment?.status === 'success') {
    console.log('[paystack-webhook] transfer.success already processed:', paymentType, bookingId);
    return;
  }

  // ── Update payments row ───────────────────────────────────────────────────
  await supabase
    .from('payments')
    .update({ status: 'success', provider_ref: reference, raw_payload: data })
    .eq('booking_id', bookingId)
    .eq('payment_type', paymentType);

  // ── Update booking status ─────────────────────────────────────────────────
  if (paymentType === 'prep_advance') {
    await supabase
      .from('bookings')
      .update({ status: 'confirmed', prep_sent_at: new Date().toISOString() })
      .eq('id', bookingId);
    console.log('[paystack-webhook] prep_advance success → booking confirmed:', bookingId);

  } else if (paymentType === 'final_payout') {
    await supabase
      .from('bookings')
      .update({
        status:       'completed',
        completed_at: new Date().toISOString(),
        escrow_status: 'released',
      })
      .eq('id', bookingId);
    console.log('[paystack-webhook] final_payout success → booking completed:', bookingId);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// transfer.failed / transfer.reversed — payout failed
// ──────────────────────────────────────────────────────────────────────────────
async function handleTransferFailed(supabase: any, data: Record<string, any>, eventType: string) {
  const reference: string = data.reference ?? data.transfer_code ?? '';
  const bookingId = reference.startsWith('prep_')
    ? reference.replace('prep_', '')
    : reference.replace('final_', '');

  const paymentType = reference.startsWith('prep_') ? 'prep_advance' : 'final_payout';
  const failureReason = data.gateway_response ?? `Transfer ${eventType}`;

  await supabase
    .from('payments')
    .update({
      status:      'failed',
      raw_payload: { ...data, failure_reason: failureReason },
    })
    .eq('booking_id', bookingId)
    .eq('payment_type', paymentType);

  console.error(`[paystack-webhook] ${eventType}: booking=${bookingId}, type=${paymentType}, reason=${failureReason}`);
  // Alert ops team here — add Slack/email webhook call as needed
}
