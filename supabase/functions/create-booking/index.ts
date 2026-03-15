import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ──────────────────────────────────────────────────────────────────────────────
// Environment
// ──────────────────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY') ?? '';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://your-app.vercel.app';

const PREP_ADVANCE_RATE = 0.25;   // 25% of total
const FINAL_PAYOUT_RATE = 0.60;   // 60% of total
const COMMISSION_RATE    = 0.15;   // 15% stays with Foodie

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ──────────────────────────────────────────────────────────────────────────────
// Main handler
// POST /create-booking
// Body: { menu_id, date_time, guests_count, address, special_requests?, chef_id? }
// ──────────────────────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonError('Unauthorized: Missing token', 401);
  }

  // Use the user's own token to initialize the client for verification
  // This is more robust in Edge Functions than using service-role for getUser
  const userClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  
  if (authErr || !user) {
    console.error('[create-booking] Auth verification failed:', authErr);
    return jsonError(`Unauthorized: ${authErr?.message || 'Invalid token'}`, 401);
  }

  // For DB operations that require bypass (like updating bookings status), 
  // we'll use a separate service-role client.
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('[create-booking] User verified:', user.email);

  try {
    const body = await req.json();
    const {
      menu_id,
      date_time,
      guests_count,
      address,
      special_requests,
      chef_id: preferredChefId,
    } = body;

    // ── Validate required fields ────────────────────────────────────────────
    if (!menu_id || !date_time || !guests_count || !address) {
      return jsonError('Missing required fields: menu_id, date_time, guests_count, address', 400);
    }

    const bookingDate = new Date(date_time);
    if (isNaN(bookingDate.getTime()) || bookingDate < new Date()) {
      return jsonError('Invalid or past booking date', 400);
    }

    const guestCount = Number(guests_count);
    if (guestCount < 1) return jsonError('guests_count must be at least 1', 400);

    // ── Fetch menu & calculate price ────────────────────────────────────────
    const { data: menu, error: menuErr } = await supabase
      .from('menus')
      .select('id, experience_id, base_price, price_per_person, guest_min, guest_max, status')
      .eq('id', menu_id)
      .single();

    if (menuErr || !menu) return jsonError('Menu not found', 404);

    const basePrice = Number(menu.base_price ?? 0);
    const pricePerPerson = Number(menu.price_per_person ?? 0);
    const totalAmount = parseFloat(
      (basePrice + pricePerPerson * guestCount).toFixed(2),
    );

    const prepAdvanceAmount = parseFloat((totalAmount * PREP_ADVANCE_RATE).toFixed(2));
    const finalPayoutAmount = parseFloat((totalAmount * FINAL_PAYOUT_RATE).toFixed(2));
    const commissionAmount  = parseFloat((totalAmount * COMMISSION_RATE).toFixed(2));
    const eventDate = bookingDate.toISOString().split('T')[0];

    // ── Insert booking (status = 'pending') ─────────────────────────────────
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert({
        client_id:            user.id,
        menu_id,
        date_time,
        event_date:           eventDate,
        address,
        guests_count:         guestCount,
        special_requests:     special_requests ?? null,
        status:               'pending',
        // Legacy price columns (keep existing system happy)
        total_price:          totalAmount,
        // New payment system columns
        total_amount:         totalAmount,
        prep_advance_amount:  prepAdvanceAmount,
        final_payout_amount:  finalPayoutAmount,
        commission_amount:    commissionAmount,
        payment_model:        'full_digital',
        escrow_status:        'none',
        experience_id:        menu.experience_id ?? null,
      })
      .select()
      .single();

    if (bookingErr || !booking) {
      console.error('[create-booking] booking insert error:', bookingErr);
      return jsonError('Failed to create booking', 500);
    }

    // ── Insert client_charge payment record (pending) ────────────────────────
    await supabase.from('payments').insert({
      booking_id:   booking.id,
      payment_type: 'client_charge',
      amount:       totalAmount,
      currency:     'KES',
      status:       'pending',
    });

    // ── Determine subaccount for Paystack split payment ──────────────────────
    let subaccountCode: string | null = null;
    if (preferredChefId) {
      const { data: chef } = await supabase
        .from('chefs')
        .select('paystack_subaccount_code')
        .eq('id', preferredChefId)
        .single();
      subaccountCode = chef?.paystack_subaccount_code ?? null;
    }

    // ── Initialize Paystack payment ──────────────────────────────────────────
    let authorizationUrl: string | null = null;

    if (PAYSTACK_SECRET_KEY) {
      const paystackPayload: Record<string, unknown> = {
        email:        user.email,
        amount:       Math.round(totalAmount * 100), // minor units (kobo)
        currency:     'KES',
        reference:    booking.id,  // Use booking UUID as idempotency key
        callback_url: `${APP_URL}/booking/success?id=${booking.id}`,
        metadata: {
          booking_id:    booking.id,
          payment_type:  'client_charge',
          cancel_action: `${APP_URL}/booking/cancel?id=${booking.id}`,
          client_id:     user.id,
        },
      };

      // If a preferred chef has a sub-account, use Paystack split
      if (subaccountCode) {
        paystackPayload.subaccount = subaccountCode;
        paystackPayload.transaction_charge = Math.round(commissionAmount * 100);
        paystackPayload.bearer = 'subaccount';
      }

      const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paystackPayload),
      });

      const paystackData = await paystackRes.json();

      if (paystackData.status && paystackData.data?.authorization_url) {
        authorizationUrl = paystackData.data.authorization_url;

        // Store Paystack reference on booking
        await supabase
          .from('bookings')
          .update({ paystack_ref: booking.id })
          .eq('id', booking.id);
      } else {
        console.error('[create-booking] Paystack init failed:', paystackData.message);
      }
    }

    return json({
      success:           true,
      booking_id:        booking.id,
      authorization_url: authorizationUrl,
      amounts: {
        total:        totalAmount,
        prep_advance: prepAdvanceAmount,
        final_payout: finalPayoutAmount,
        commission:   commissionAmount,
      },
    }, 201);

  } catch (err) {
    console.error('[create-booking] Error:', err);
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
