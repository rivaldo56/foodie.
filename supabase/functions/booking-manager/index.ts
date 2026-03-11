import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ──────────────────────────────────────────────────────────────────────────────
// Environment
// ──────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const PLATFORM_COMMISSION_RATE = parseFloat(Deno.env.get('PLATFORM_COMMISSION_RATE') ?? '0.15');
const SLA_MINUTES = parseInt(Deno.env.get('SLA_MINUTES') ?? '15', 10);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
interface BookingRequest {
  menu_id: string;
  date_time: string;        // ISO string
  guests_count: number;
  address: string;
  special_requests?: string;
  payment_model: 'full_digital' | 'cash_balance';
  experience_type?: string;
}

interface ChefCandidate {
  id: string;
  user_id: string;
  name: string;
  rotation_priority_score: number;
  service_types: string[];
  cuisine_specialties: string[];
  travel_radius_km: number;
  per_guest_rate: number | null;
  base_booking_fee: number | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Main handler
// ──────────────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  console.log(`[booking-manager] Request: ${req.method} ${req.url}`);
  try {
    const clone = req.clone();
    const text = await clone.text();
    console.log(`[booking-manager] Body: ${text.slice(0, 500)}`);
  } catch (e) {
    console.log('[booking-manager] Could not log body');
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? 'create';
  console.log(`[booking-manager] Incoming request: ${req.method} action=${action}`);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    if (action === 'create') {
      return await handleCreate(req, supabase);
    } else if (action === 'accept') {
      return await handleAccept(req, supabase);
    } else if (action === 'decline') {
      return await handleDecline(req, supabase);
    } else if (action === 'rotate') {
      return await handleRotate(req, supabase);
    } else {
      return jsonError('Unknown action', 400);
    }
  } catch (err) {
    console.error('[booking-manager]', err);
    return jsonError('Internal server error', 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// ACTION: create – Client submits a new booking request
// ──────────────────────────────────────────────────────────────────────────────
async function handleCreate(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonError('Unauthorized: Missing Authorization header', 401);

  // Verify the requesting user using the service client (more robust than anonymous client)
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  
  if (authErr || !user) {
    console.error('[booking-manager] Auth Error:', authErr);
    return jsonError('Unauthorized: Invalid or expired token', 401);
  }

  const body: BookingRequest = await req.json();
  const { menu_id, date_time, guests_count, address, special_requests, payment_model, experience_type } = body;

  if (!menu_id || !date_time || !guests_count || !address) {
    return jsonError('Missing required fields: menu_id, date_time, guests_count, address', 400);
  }

  const bookingDate = new Date(date_time);
  if (isNaN(bookingDate.getTime()) || bookingDate < new Date()) {
    return jsonError('Invalid or past booking date', 400);
  }

  // ── GATE 1 + GATE 2: Validate menu, calculate price, find qualified chefs ──
  const { data: menu, error: menuErr } = await supabase
    .from('menus')
    .select('id, experience_id, base_price, price_per_person, guest_min, guest_max, status, dietary_tags')
    .eq('id', menu_id)
    .single();

  if (menuErr || !menu) return jsonError('Menu not found', 404);
  if (menu.status !== 'active') return jsonError('Menu is not available for booking', 400);

  const guestCount = Number(guests_count);
  if (guestCount < menu.guest_min || guestCount > menu.guest_max) {
    return jsonError(`Guest count must be between ${menu.guest_min} and ${menu.guest_max}`, 400);
  }

  const basePrice = Number(menu.base_price ?? 0);
  const pricePerPerson = Number(menu.price_per_person ?? 0);
  
  const totalPrice = (basePrice + (pricePerPerson * guestCount)); 
  const depositAmount = Math.round(totalPrice * 0.30 * 100) / 100;  // 30%
  const remainingAmount = Math.round((totalPrice - depositAmount) * 100) / 100;
  const platformFee = Math.round(totalPrice * PLATFORM_COMMISSION_RATE * 100) / 100;

  // ── GATE 2: Find available, qualified chefs ──
  const chefQueue = await findQualifiedChefs(supabase, {
    bookingDate,
    guestCount,
    totalPrice,
    menuDietaryTags: menu.dietary_tags ?? [],
  });

  if (chefQueue.length === 0) {
    return jsonError('No available chefs found for this slot. Please try a different date or time.', 409);
  }

  const firstChefId = chefQueue[0].id;
  const slaExpiresAt = new Date(Date.now() + SLA_MINUTES * 60 * 1000).toISOString();

  // ── Insert booking ──
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .insert({
      client_id: user.id,
      menu_id,
      chef_id: firstChefId,
      date_time,
      address,
      guests_count: guestCount,
      total_price: totalPrice,
      special_requests: special_requests ?? null,
      status: 'rotating',
      payment_model: payment_model ?? 'full_digital',
      deposit_amount: depositAmount,
      sla_expires_at: slaExpiresAt,
      rotation_count: 0,
      escrow_status: 'none',
      experience_id: menu.experience_id,
      experience_type: experience_type ?? null,
      chef_queue: chefQueue.map((c: any) => c.id),
    })
    .select()
    .single();

  if (bookingErr || !booking) {
    console.error('[booking-manager] insert error', bookingErr);
    return jsonError('Failed to create booking', 500);
  }

  // ── Create escrow transaction record ──
  const { error: escrowErr } = await supabase
    .from('escrow_transactions')
    .insert({
      booking_id: booking.id,
      total_amount: totalPrice,
      deposit_amount: depositAmount,
      remaining_amount: remainingAmount,
      platform_fee: platformFee,
      escrow_status: 'held',
    });

  if (escrowErr) {
    console.error('[booking-manager] escrow insert error', escrowErr);
    // Don't fail the booking – escrow can be reconciled
  }

  // ── Initiate Paystack deposit payment (if key is configured) ──
  let paymentUrl: string | null = null;

  if (PAYSTACK_SECRET_KEY) {
    try {
      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          amount: Math.round(depositAmount * 100), // Paystack uses kobo/cents
          currency: 'KES',
          reference: `deposit_${booking.id}`,
          metadata: {
            booking_id: booking.id,
            payment_type: 'deposit',
            client_id: user.id,
          },
          callback_url: `${SUPABASE_URL.replace('supabase.co', 'supabase.co')}/functions/v1/payment-processor`,
        }),
      });
      const paystackData = await paystackRes.json();
      if (paystackData.status && paystackData.data?.authorization_url) {
        paymentUrl = paystackData.data.authorization_url;

        // Store deposit reference on escrow record
        await supabase
          .from('escrow_transactions')
          .update({ deposit_ref: `deposit_${booking.id}` })
          .eq('booking_id', booking.id);
      }
    } catch (payErr) {
      console.error('[booking-manager] Paystack init error', payErr);
    }
  }

  // ── Notify first chef via Supabase Realtime broadcast ──
  try {
    await supabase.channel(`chef:${firstChefId}`).send({
      type: 'broadcast',
      event: 'booking_request',
      payload: {
        booking_id: booking.id,
        sla_expires_at: slaExpiresAt,
        guests_count: guestCount,
        date_time,
        address,
        total_price: totalPrice,
        estimated_payout: totalPrice - platformFee,
      },
    });
  } catch (rtErr) {
    console.error('[booking-manager] Realtime notify error', rtErr);
  }

  return json({ 
    success: true, 
    booking_id: booking.id, 
    payment_url: paymentUrl,
    deposit_amount: depositAmount,
    chef_queue_count: chefQueue.length,
    sla_expires_at: slaExpiresAt,
  }, 201);
}

// ──────────────────────────────────────────────────────────────────────────────
// ACTION: accept – Chef accepts a booking
// ──────────────────────────────────────────────────────────────────────────────
async function handleAccept(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonError('Missing Authorization header', 401);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token);
  
  if (authErr || !authUser) {
    console.error('[handleAccept] Token Verification Failed:', authErr);
    return jsonError(`AUTH_VERIFICATION_FAILED: ${authErr?.message || 'No user found for token'}`, 401);
  }

  const body = await req.json();
  const { booking_id, chef_user_id, response_time_seconds } = body;

  console.log('[handleAccept] Auth Success:', { authUser_id: authUser.id, body_chef_user_id: chef_user_id });

  if (!booking_id || !chef_user_id) return jsonError('MISSING_FIELDS: booking_id or chef_user_id', 400);
  if (authUser.id !== chef_user_id) return jsonError(`IDENTITY_MISMATCH: token=${authUser.id} body=${chef_user_id}`, 403);

  // Verify chef owns this assignment
  const { data: chef } = await supabase
    .from('chefs')
    .select('id')
    .eq('user_id', chef_user_id)
    .single();

  if (!chef) return jsonError('Chef not found', 404);

  const { data: booking, error: fetchErr } = await supabase
    .from('bookings')
    .select('id, status, chef_id, chef_queue')
    .eq('id', booking_id)
    .single();

  if (fetchErr || !booking) return jsonError('Booking not found', 404);
  if (booking.chef_id !== chef.id) return jsonError('Not authorized to accept this booking', 403);
  if (!['rotating', 'assigned'].includes(booking.status)) {
    return jsonError(`Booking cannot be accepted in status: ${booking.status}`, 400);
  }

  // Update booking to confirmed
  const { error: updateErr } = await supabase
    .from('bookings')
    .update({ status: 'confirmed', sla_expires_at: null })
    .eq('id', booking_id);

  if (updateErr) return jsonError('Failed to confirm booking', 500);

  // Update performance metrics
  await updateChefMetrics(supabase, chef.id, {
    accepted: true,
    response_time_seconds: response_time_seconds ?? 0,
  });

  return json({ success: true, booking_id, status: 'confirmed' });
}

// ──────────────────────────────────────────────────────────────────────────────
// ACTION: decline – Chef declines a booking
// ──────────────────────────────────────────────────────────────────────────────
async function handleDecline(req: Request, supabase: any) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonError('Missing Authorization header', 401);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user: authUser }, error: authErr } = await supabase.auth.getUser(token);
  
  if (authErr || !authUser) {
    console.error('[handleDecline] Token Verification Failed:', authErr);
    return jsonError(`AUTH_VERIFICATION_FAILED: ${authErr?.message || 'No user found for token'}`, 401);
  }

  const body = await req.json();
  const { booking_id, chef_user_id, reason, response_time_seconds } = body;

  console.log('[handleDecline] Auth Success:', { authUser_id: authUser.id, body_chef_user_id: chef_user_id });

  if (!booking_id || !chef_user_id) return jsonError('MISSING_FIELDS: booking_id or chef_user_id', 400);
  if (authUser.id !== chef_user_id) return jsonError(`IDENTITY_MISMATCH: token=${authUser.id} body=${chef_user_id}`, 403);

  const { data: chef } = await supabase
    .from('chefs')
    .select('id')
    .eq('user_id', chef_user_id)
    .single();

  if (!chef) return jsonError('Chef not found', 404);

  // Update metrics for the declining chef
  await updateChefMetrics(supabase, chef.id, {
    accepted: false,
    response_time_seconds: response_time_seconds ?? 0,
  });

  // Rotate to next chef
  return await rotateToNextChef(supabase, booking_id, chef.id, reason ?? 'declined');
}

// ──────────────────────────────────────────────────────────────────────────────
// ACTION: rotate – System auto-rotates (SLA expired)
// ──────────────────────────────────────────────────────────────────────────────
async function handleRotate(req: Request, supabase: any) {
  const body = await req.json();
  const { booking_id, current_chef_id } = body;

  if (!booking_id) return jsonError('Missing booking_id', 400);

  // Mark SLA miss on current chef
  if (current_chef_id) {
    const { data: metrics } = await supabase
      .from('chef_performance_metrics')
      .select('total_sla_misses')
      .eq('chef_id', current_chef_id)
      .single();

    if (metrics) {
      await supabase
        .from('chef_performance_metrics')
        .update({ 
          total_sla_misses: (metrics.total_sla_misses ?? 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('chef_id', current_chef_id);
      
      await supabase.rpc('recalculate_chef_priority_score', { p_chef_id: current_chef_id });
    }
  }

  return await rotateToNextChef(supabase, booking_id, current_chef_id, 'sla_expired');
}

// ──────────────────────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────────────────────
async function findQualifiedChefs(
  supabase: any,
  opts: {
    bookingDate: Date;
    guestCount: number;
    totalPrice: number;
    menuDietaryTags: string[];
  }
): Promise<ChefCandidate[]> {
  // Fetch approved/pending chefs with their performance metrics
  // Removed strict .eq('verified', true) to allow approved chefs in v3 rotation
  const { data: chefs, error } = await supabase
    .from('chefs')
    .select(`
      id, user_id, name, service_types, cuisine_specialties,
      travel_radius_km, per_guest_rate, base_booking_fee,
      chef_performance_metrics (rotation_priority_score)
    `)
    .in('onboarding_status', ['approved', 'pending_verification']);

  if (error || !chefs) return [];

  // Get blocked availability for the booking window
  const windowStart = opts.bookingDate.toISOString();
  const windowEnd = new Date(opts.bookingDate.getTime() + 4 * 60 * 60 * 1000).toISOString(); // assume 4h event

  const { data: blockedAvailability } = await supabase
    .from('chef_availability')
    .select('chef_id')
    .eq('type', 'blocked')
    .lte('start_at', windowEnd)
    .gte('end_at', windowStart);

  const blockedChefIds = new Set((blockedAvailability ?? []).map((a: any) => a.chef_id));

  // Filter and sort
  const qualified = chefs
    .filter((chef: any) => !blockedChefIds.has(chef.id))
    .map((chef: any) => ({
      ...chef,
      rotation_priority_score: chef.chef_performance_metrics?.[0]?.rotation_priority_score ?? 100,
    }))
    .sort((a: any, b: any) => b.rotation_priority_score - a.rotation_priority_score);

  return qualified as ChefCandidate[];
}

async function rotateToNextChef(
  supabase: any,
  bookingId: string,
  currentChefId: string | null,
  reason: string,
) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, chef_queue, rotation_count, client_id, date_time, guests_count, total_price, sla_expires_at')
    .eq('id', bookingId)
    .single();

  if (!booking) return jsonError('Booking not found', 404);

  const queue: string[] = booking.chef_queue ?? [];
  const currentIdx = currentChefId ? queue.indexOf(currentChefId) : -1;
  const nextChefId = queue[currentIdx + 1] ?? null;

  if (!nextChefId) {
    // No more chefs – mark as failed rotation
    await supabase
      .from('bookings')
      .update({
        status: 'canceled',
        decline_reason: 'No available chefs accepted the booking.',
      })
      .eq('id', bookingId);

    return json({ success: false, message: 'No more chefs available. Booking cancelled.' }, 200);
  }

  const slaExpiresAt = new Date(Date.now() + SLA_MINUTES * 60 * 1000).toISOString();

  await supabase
    .from('bookings')
    .update({
      chef_id: nextChefId,
      rotation_count: (booking.rotation_count ?? 0) + 1,
      sla_expires_at: slaExpiresAt,
      decline_reason: reason,
    })
    .eq('id', bookingId);

  // Notify next chef
  try {
    const platformFee = (booking.total_price ?? 0) * PLATFORM_COMMISSION_RATE;
    await supabase.channel(`chef:${nextChefId}`).send({
      type: 'broadcast',
      event: 'booking_request',
      payload: {
        booking_id: bookingId,
        sla_expires_at: slaExpiresAt,
        guests_count: booking.guests_count,
        date_time: booking.date_time,
        total_price: booking.total_price,
        estimated_payout: (booking.total_price ?? 0) - platformFee,
      },
    });
  } catch (_) { /* non-critical */ }

  return json({ success: true, rotated_to: nextChefId, sla_expires_at: slaExpiresAt });
}

async function updateChefMetrics(
  supabase: any,
  chefId: string,
  opts: { accepted: boolean; response_time_seconds: number },
) {
  const { data: m } = await supabase
    .from('chef_performance_metrics')
    .select('*')
    .eq('chef_id', chefId)
    .single();

  if (!m) return;

  const totalReceived = (m.total_jobs_received ?? 0) + 1;
  const totalAccepted = opts.accepted ? (m.total_jobs_accepted ?? 0) + 1 : m.total_jobs_accepted;
  const totalCancelled = !opts.accepted ? (m.total_jobs_cancelled ?? 0) + 1 : m.total_jobs_cancelled;

  // Rolling average response time
  const prevAvg = m.avg_response_time_seconds ?? 0;
  const newAvg = ((prevAvg * (totalReceived - 1)) + opts.response_time_seconds) / totalReceived;

  await supabase
    .from('chef_performance_metrics')
    .update({
      total_jobs_received: totalReceived,
      total_jobs_accepted: totalAccepted,
      total_jobs_cancelled: totalCancelled,
      avg_response_time_seconds: newAvg,
      acceptance_rate: totalReceived > 0 ? totalAccepted / totalReceived : 1,
      cancellation_rate: totalReceived > 0 ? totalCancelled / totalReceived : 0,
      updated_at: new Date().toISOString(),
    })
    .eq('chef_id', chefId);

  await supabase.rpc('recalculate_chef_priority_score', { p_chef_id: chefId });
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
