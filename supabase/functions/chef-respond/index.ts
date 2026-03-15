import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ──────────────────────────────────────────────────────────────────────────────
// Environment
// ──────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL              = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_SECRET_KEY        = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const APP_URL                    = Deno.env.get('APP_URL') ?? 'https://your-app.vercel.app';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ──────────────────────────────────────────────────────────────────────────────
// chef-respond
// POST body: { booking_id, response: 'accepted' | 'declined', chef_user_id }
// The chef must be authenticated (JWT in Authorization header)
// ──────────────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') return jsonError('Method not allowed', 405);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonError('Unauthorized', 401);

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return jsonError('Unauthorized: invalid token', 401);

  try {
    const body = await req.json();
    const { booking_id, response, chef_user_id } = body;

    if (!booking_id || !response) {
      return jsonError('Missing required fields: booking_id, response', 400);
    }

    if (!['accepted', 'declined'].includes(response)) {
      return jsonError("response must be 'accepted' or 'declined'", 400);
    }

    // Allow chef_user_id from body, or fall back to JWT user
    const chefUserId = chef_user_id ?? user.id;
    if (user.id !== chefUserId) {
      return jsonError('Identity mismatch', 403);
    }

    // ── Resolve chef profile ──────────────────────────────────────────────
    const { data: chef, error: chefErr } = await supabase
      .from('chefs')
      .select('id, name, user_id, paystack_recipient_code, avg_rating')
      .eq('user_id', chefUserId)
      .single();

    if (chefErr || !chef) return jsonError('Chef profile not found', 404);

    // ── Fetch the active dispatch_attempt ─────────────────────────────────
    const { data: attempt, error: attemptErr } = await supabase
      .from('dispatch_attempts')
      .select('id, status, expires_at, attempt_num')
      .eq('booking_id', booking_id)
      .eq('chef_id', chef.id)
      .eq('status', 'pending')
      .order('attempt_num', { ascending: false })
      .limit(1)
      .single();

    if (attemptErr || !attempt) {
      return jsonError('No active dispatch attempt found — this booking may have been reassigned', 404);
    }

    // ── Validate attempt is not expired ───────────────────────────────────
    if (new Date(attempt.expires_at) < new Date()) {
      // Mark as timed_out
      await supabase
        .from('dispatch_attempts')
        .update({ status: 'timed_out', responded_at: new Date().toISOString() })
        .eq('id', attempt.id);

      return jsonError('Response window expired — booking has been reassigned', 410);
    }

    // ── Fetch booking ─────────────────────────────────────────────────────
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, status, current_chef_id, prep_advance_amount, total_amount, total_price, date_time, event_date, client_id')
      .eq('id', booking_id)
      .single();

    if (bookingErr || !booking) return jsonError('Booking not found', 404);

    if (booking.current_chef_id !== chef.id) {
      return jsonError('This booking is no longer assigned to you', 403);
    }

    const now = new Date().toISOString();

    // ═══════════════════════════════════════
    // ACCEPTED
    // ═══════════════════════════════════════
    if (response === 'accepted') {
      // Step 1: Update dispatch_attempt
      await supabase
        .from('dispatch_attempts')
        .update({ status: 'accepted', responded_at: now })
        .eq('id', attempt.id);

      // Step 2: Block chef availability on event date
      const eventDateStr = booking.event_date
        ?? new Date(booking.date_time).toISOString().split('T')[0];

      await supabase
        .from('chef_availability')
        .upsert(
          {
            chef_id:    chef.id,
            date:       eventDateStr,
            start_time: '00:00',
            end_time:   '23:59',
            is_blocked: true,
          },
          { onConflict: 'chef_id,date,start_time' },
        );

      // Step 3: Send prep advance via Paystack Transfer API
      const prepAmount = booking.prep_advance_amount ?? (booking.total_amount ?? booking.total_price) * 0.25;
      const prepRef    = `prep_${booking_id}`;

      let prepTransferCode: string | null = null;

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
              reason:    `Foodie prep advance — Booking ${booking_id}`,
              amount:    Math.round(prepAmount * 100), // minor units
              recipient: chef.paystack_recipient_code,
              currency:  'KES',
              reference: prepRef,
              metadata: {
                booking_id,
                payment_type: 'prep_advance',
                chef_id:      chef.id,
              },
            }),
          });

          const transferData = await transferRes.json();
          if (transferData.status && transferData.data?.transfer_code) {
            prepTransferCode = transferData.data.transfer_code;
            console.log(`[chef-respond] Prep advance initiated: ${prepTransferCode}, KES ${prepAmount}`);
          } else {
            console.error('[chef-respond] Paystack transfer failed:', transferData.message);
          }
        } catch (transferErr) {
          console.error('[chef-respond] Transfer API error:', transferErr);
        }
      }

      // Step 4: Insert prep_advance payments record
      await supabase.from('payments').insert({
        booking_id,
        payment_type: 'prep_advance',
        amount:       prepAmount,
        currency:     'KES',
        status:       'pending',
        provider_ref: prepRef,
        raw_payload:  { transfer_code: prepTransferCode },
      });

      // Step 5: Update chef accepted bookings counter
      const { data: chefData } = await supabase
        .from('chefs')
        .select('total_accepted')
        .eq('id', chef.id)
        .single();
      await supabase
        .from('chefs')
        .update({ total_accepted: (chefData?.total_accepted ?? 0) + 1 })
        .eq('id', chef.id);

      // Step 6: Notify client via Realtime
      try {
        await supabase.channel(`booking:${booking_id}`).send({
          type:  'broadcast',
          event: 'booking_confirmed',
          payload: {
            booking_id,
            chef_id:     chef.id,
            chef_name:   chef.name,
            chef_rating: chef.avg_rating,
            message:     'Your booking has been confirmed!',
          },
        });
      } catch (_) { /* non-critical */ }

      return json({
        success:              true,
        response:             'accepted',
        booking_id,
        chef_id:              chef.id,
        prep_advance_amount:  prepAmount,
        prep_transfer_ref:    prepTransferCode ?? prepRef,
        message:              'Booking accepted. Prep advance initiated.',
      });

    // ═══════════════════════════════════════
    // DECLINED
    // ═══════════════════════════════════════
    } else {
      // Step 1: Update dispatch_attempt
      await supabase
        .from('dispatch_attempts')
        .update({ status: 'declined', responded_at: now })
        .eq('id', attempt.id);

      // Step 2: Call dispatch-booking for next chef (silent cascade)
      try {
        await fetch(`${SUPABASE_URL}/functions/v1/dispatch-booking`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ booking_id }),
        });
      } catch (dispatchErr) {
        console.error('[chef-respond] Failed to trigger re-dispatch:', dispatchErr);
      }

      return json({
        success:    true,
        response:   'declined',
        booking_id,
        message:    'Booking declined. Dispatching to next available chef.',
      });
    }

  } catch (err) {
    console.error('[chef-respond] Error:', err);
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
