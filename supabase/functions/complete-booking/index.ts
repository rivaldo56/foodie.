import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ──────────────────────────────────────────────────────────────────────────────
// Environment
// ──────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_SECRET_KEY        = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ──────────────────────────────────────────────────────────────────────────────
// complete-booking
// POST body: { booking_id, rating: 1-5, review?: string }
// Must be called by the booking's client (JWT verified)
// ──────────────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Auth: client must be authenticated ────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonError('Unauthorized', 401);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return jsonError('Unauthorized: invalid token', 401);

  try {
    const body = await req.json();
    const { booking_id, rating, review } = body;

    if (!booking_id) return jsonError('Missing booking_id', 400);

    if (!rating || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return jsonError('Rating must be an integer between 1 and 5', 400);
    }

    const numericRating = Number(rating);

    // ── Fetch booking ─────────────────────────────────────────────────────
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select(`
        id, status, client_id, current_chef_id, chef_id,
        total_amount, total_price, prep_advance_amount, commission_amount,
        final_payout_amount, date_time, event_date, completed_at
      `)
      .eq('id', booking_id)
      .single();

    if (bookingErr || !booking) return jsonError('Booking not found', 404);

    // ── Verify caller is the booking client ──────────────────────────────
    if (booking.client_id !== user.id) {
      return jsonError('You are not authorized to complete this booking', 403);
    }

    // ── Verify booking is in completable state ────────────────────────────
    if (!['confirmed', 'in_progress'].includes(booking.status)) {
      return jsonError(
        `Booking cannot be completed from status: ${booking.status}`,
        400,
      );
    }

    // ── Guard: event date must have passed ────────────────────────────────
    const eventDate = new Date(booking.event_date ?? booking.date_time);
    if (eventDate > new Date()) {
      return jsonError('Cannot confirm delivery before the event date', 400);
    }

    // ── Resolve chef ──────────────────────────────────────────────────────
    const chefId = booking.current_chef_id ?? booking.chef_id;
    if (!chefId) return jsonError('No chef assigned to this booking', 400);

    const { data: chef, error: chefErr } = await supabase
      .from('chefs')
      .select('id, name, avg_rating, total_bookings_completed, paystack_recipient_code')
      .eq('id', chefId)
      .single();

    if (chefErr || !chef) return jsonError('Chef not found', 404);

    // ── Calculate final payout ─────────────────────────────────────────────
    const totalAmount    = Number(booking.total_amount ?? booking.total_price ?? 0);
    const prepAdvance    = Number(booking.prep_advance_amount ?? totalAmount * 0.25);
    const commission     = Number(booking.commission_amount   ?? totalAmount * 0.15);
    const finalPayout    = Number(
      booking.final_payout_amount
        ?? parseFloat((totalAmount - prepAdvance - commission).toFixed(2)),
    );
    const finalRef = `final_${booking_id}`;

    // ── Save rating + review on booking ───────────────────────────────────
    await supabase
      .from('bookings')
      .update({
        status:         'in_progress',  // Moves to 'completed' when transfer.success fires
        client_rating:  numericRating,
        client_review:  review ?? null,
      })
      .eq('id', booking_id);

    // ── Insert final_payout payments record ───────────────────────────────
    await supabase.from('payments').insert({
      booking_id,
      payment_type: 'final_payout',
      amount:       finalPayout,
      currency:     'KES',
      status:       'pending',
      provider_ref: finalRef,
    });

    // ── Initiate Paystack Transfer for final payout ───────────────────────
    let transferCode: string | null = null;

    if (PAYSTACK_SECRET_KEY && chef.paystack_recipient_code) {
      try {
        const transferRes = await fetch('https://api.paystack.co/transfer', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source:    'balance',
            reason:    `Foodie final payout — Booking ${booking_id}`,
            amount:    Math.round(finalPayout * 100), // minor units (kobo)
            recipient: chef.paystack_recipient_code,
            currency:  'KES',
            reference: finalRef,
            metadata: {
              booking_id,
              payment_type: 'final_payout',
              chef_id:      chef.id,
            },
          }),
        });

        const transferData = await transferRes.json();
        if (transferData.status && transferData.data?.transfer_code) {
          transferCode = transferData.data.transfer_code;
          console.log(`[complete-booking] Final payout initiated: ${transferCode}, KES ${finalPayout}`);
        } else {
          console.error('[complete-booking] Paystack transfer failed:', transferData.message);
        }
      } catch (transferErr) {
        console.error('[complete-booking] Transfer API error:', transferErr);
      }
    }

    // ── Update chef avg_rating (rolling average) ──────────────────────────
    const prevRating       = Number(chef.avg_rating ?? 5);
    const totalCompleted   = (chef.total_bookings_completed ?? 0) + 1;
    const newAvgRating     = parseFloat(
      (((prevRating * (totalCompleted - 1)) + numericRating) / totalCompleted).toFixed(2),
    );

    await supabase
      .from('chefs')
      .update({
        avg_rating:               newAvgRating,
        total_bookings_completed: totalCompleted,
      })
      .eq('id', chefId);

    return json({
      success:           true,
      booking_id,
      rating:            numericRating,
      final_payout:      finalPayout,
      transfer_ref:      transferCode ?? finalRef,
      chef_new_rating:   newAvgRating,
      message:           'Delivery confirmed. Final payout initiated.',
    });

  } catch (err) {
    console.error('[complete-booking] Error:', err);
    return jsonError('Internal server error', 500);
  }
});

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
