import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ──────────────────────────────────────────────────────────────────────────────
// Environment
// ──────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DISPATCH_WINDOW_MINUTES   = 15;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ──────────────────────────────────────────────────────────────────────────────
// dispatch-booking
// POST body: { booking_id }
// Called by: paystack-webhook (after charge.success), or pg_cron (SLA timeout)
// ──────────────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { booking_id } = await req.json();
    if (!booking_id) return jsonError('Missing booking_id', 400);

    return await dispatchNextChef(supabase, booking_id);

  } catch (err) {
    console.error('[dispatch-booking] Error:', err);
    return jsonError('Internal server error', 500);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// Core dispatch logic
// ──────────────────────────────────────────────────────────────────────────────
async function dispatchNextChef(supabase: any, bookingId: string) {
  // ── Fetch booking ─────────────────────────────────────────────────────────
  const { data: booking, error: bookingErr } = await supabase
    .from('bookings')
    .select('id, status, date_time, event_date, guests_count, address, total_amount, commission_amount, total_price, menu_id, cuisine_tags')
    .eq('id', bookingId)
    .single();

  if (bookingErr || !booking) return jsonError('Booking not found', 404);

  if (!['paid', 'dispatching'].includes(booking.status)) {
    console.log('[dispatch-booking] Booking not in dispatchable state:', booking.status);
    return json({ message: `Booking status '${booking.status}' — skipping dispatch` });
  }

  // ── Get previously tried chefs from dispatch_attempts ─────────────────────
  const { data: prevAttempts } = await supabase
    .from('dispatch_attempts')
    .select('chef_id')
    .eq('booking_id', bookingId);

  const triedChefIds: string[] = (prevAttempts ?? []).map((a: any) => a.chef_id);
  const attemptNum = triedChefIds.length + 1;

  // ── Fetch available & eligible chefs ──────────────────────────────────────
  const bookingDate = new Date(booking.date_time ?? booking.event_date ?? Date.now());
  const bookingDateStr = bookingDate.toISOString().split('T')[0];

  let chefQuery = supabase
    .from('chefs')
    .select(`
      id, name, user_id, avg_rating, total_bookings_completed,
      total_dispatched, total_accepted, cuisine_tags, cuisine_specialties,
      paystack_recipient_code, is_active, is_verified, onboarding_status
    `)
    .eq('is_active', true)
    .eq('is_verified', true)
    .in('onboarding_status', ['approved']);

  if (triedChefIds.length > 0) {
    chefQuery = chefQuery.not('id', 'in', `(${triedChefIds.join(',')})`);
  }

  const { data: allChefs, error: chefsErr } = await chefQuery;

  if (chefsErr) {
    console.error('[dispatch-booking] chef query error:', chefsErr);
    return jsonError('Failed to query chefs', 500);
  }

  // ── Filter out chefs blocked on booking date ──────────────────────────────
  const { data: blockedChefs } = await supabase
    .from('chef_availability')
    .select('chef_id')
    .eq('is_blocked', true)
    .eq('date', bookingDateStr);

  const blockedIds = new Set((blockedChefs ?? []).map((b: any) => b.chef_id));

  // Also check the V3 chef_availability blocked ranges
  const windowStart = bookingDate.toISOString();
  const windowEnd   = new Date(bookingDate.getTime() + 4 * 60 * 60 * 1000).toISOString();
  const { data: rangeBlocked } = await supabase
    .from('chef_availability')
    .select('chef_id')
    .eq('type', 'blocked')
    .lte('start_at', windowEnd)
    .gte('end_at', windowStart);

  (rangeBlocked ?? []).forEach((b: any) => blockedIds.add(b.chef_id));

  const eligibleChefs = (allChefs ?? []).filter((c: any) => !blockedIds.has(c.id));

  // ── No chefs available ────────────────────────────────────────────────────
  if (eligibleChefs.length === 0) {
    console.log('[dispatch-booking] No eligible chefs — booking:', bookingId);
    await supabase
      .from('bookings')
      .update({ status: 'no_chef_found' })
      .eq('id', bookingId);

    // TODO: Notify ops team (add Slack/email webhook here)
    console.error('[dispatch-booking] ALL CHEFS EXHAUSTED for booking:', bookingId);
    return json({ success: false, message: 'No available chefs — booking marked no_chef_found' });
  }

  // ── Score & rank chefs ────────────────────────────────────────────────────
  // Rating:          max 40 pts → (avg_rating / 5) * 40
  // Acceptance rate: max 30 pts → (total_accepted / total_dispatched) * 30
  // Bookings done:   max 20 pts → min(total_bookings_completed / 20, 1) * 20
  // Cuisine match:   max 10 pts → 10 if tags overlap, 0 if not

  const bookingCuisine: string[] = booking.cuisine_tags ?? [];

  const scored = eligibleChefs
    .map((chef: any) => {
      const ratingScore = ((chef.avg_rating ?? 5) / 5) * 40;

      const totDispatched = chef.total_dispatched ?? 0;
      const totAccepted   = chef.total_accepted   ?? 0;
      const acceptRate    = totDispatched > 0 ? totAccepted / totDispatched : 1;
      const acceptScore   = acceptRate * 30;

      const completedScore = Math.min((chef.total_bookings_completed ?? 0) / 20, 1) * 20;

      const chefCuisine: string[] = [
        ...(chef.cuisine_tags ?? []),
        ...(chef.cuisine_specialties ?? []),
      ].map((t: string) => t.toLowerCase());
      const cuisineMatch = bookingCuisine.some((t) => chefCuisine.includes(t.toLowerCase()));
      const cuisineScore = cuisineMatch ? 10 : 0;

      const totalScore = ratingScore + acceptScore + completedScore + cuisineScore;

      return { ...chef, _score: totalScore };
    })
    .sort((a: any, b: any) => b._score - a._score);

  const nextChef = scored[0];
  const expiresAt = new Date(Date.now() + DISPATCH_WINDOW_MINUTES * 60 * 1000).toISOString();

  // ── Create dispatch_attempt ───────────────────────────────────────────────
  const { error: attemptErr } = await supabase
    .from('dispatch_attempts')
    .insert({
      booking_id:  bookingId,
      chef_id:     nextChef.id,
      attempt_num: attemptNum,
      status:      'pending',
      notified_at: new Date().toISOString(),
      expires_at:  expiresAt,
    });

  if (attemptErr) {
    console.error('[dispatch-booking] dispatch_attempt insert error:', attemptErr);
  }

  // ── Update booking: awaiting_chef + dispatch metrics on chef ─────────────
  await supabase
    .from('bookings')
    .update({
      status:           'awaiting_chef',
      current_chef_id:  nextChef.id,
      // Keep existing chef_id / chef_queue for V3 compatibility
      chef_id:          nextChef.id,
    })
    .eq('id', bookingId);

  // Update chef dispatch counter
  await supabase
    .from('chefs')
    .update({ total_dispatched: (nextChef.total_dispatched ?? 0) + 1 })
    .eq('id', nextChef.id);

  // ── Notify chef via Supabase Realtime ─────────────────────────────────────
  const totalAmount      = booking.total_amount ?? booking.total_price ?? 0;
  const commissionAmount = booking.commission_amount ?? (totalAmount * 0.15);
  const prepAdvance      = totalAmount * 0.25;
  const finalPayout      = totalAmount * 0.60;

  try {
    await supabase.channel(`chef:${nextChef.id}`).send({
      type:  'broadcast',
      event: 'booking_request',
      payload: {
        booking_id:    bookingId,
        expires_at:    expiresAt,
        attempt_num:   attemptNum,
        date_time:     booking.date_time,
        address:       booking.address,
        guests_count:  booking.guests_count,
        total_amount:  totalAmount,
        prep_advance:  prepAdvance,
        final_payout:  finalPayout,
        chef_earnings: prepAdvance + finalPayout,
        // Deep links for Accept/Decline (chef responds via chef-respond function)
        accept_url: `${Deno.env.get('APP_URL') ?? ''}/chef/respond?booking_id=${bookingId}&response=accepted`,
        decline_url: `${Deno.env.get('APP_URL') ?? ''}/chef/respond?booking_id=${bookingId}&response=declined`,
      },
    });
  } catch (rtErr) {
    console.error('[dispatch-booking] Realtime notify failed:', rtErr);
  }

  console.log(`[dispatch-booking] Dispatched booking ${bookingId} to chef ${nextChef.name} (attempt #${attemptNum}), score=${nextChef._score.toFixed(1)}`);

  return json({
    success:     true,
    booking_id:  bookingId,
    chef_id:     nextChef.id,
    chef_name:   nextChef.name,
    attempt_num: attemptNum,
    expires_at:  expiresAt,
    score:       nextChef._score,
  });
}

// ── Response helpers ───────────────────────────────────────────────────────────
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number) {
  return json({ error: message }, status);
}
