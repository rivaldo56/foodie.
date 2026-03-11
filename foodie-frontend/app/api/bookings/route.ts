import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  const allCookies = cookieStore.getAll();
  const tokenCookie = cookieStore.get('token')?.value;

  console.log('[api/bookings POST] Processing booking request...');

  let authUser: any = null;
  let authToken: string | null = null;

  // 1. Try standard supabase.auth.getUser()
  const { data: { user: standardUser } } = await supabase.auth.getUser();
  if (standardUser) {
    authUser = standardUser;
    const { data: { session } } = await supabase.auth.getSession();
    authToken = session?.access_token || null;
  }

  // 2. Fallback to manual 'token' cookie if standard auth failed
  if (!authUser && tokenCookie) {
    const { data: { user: manualUser } } = await supabase.auth.getUser(tokenCookie);
    if (manualUser) {
      authUser = manualUser;
      authToken = tokenCookie;
    }
  }

  if (!authUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { menu_id, meal_id, date_time, guests_count, address, special_requests, payment_model } = body;

    if (!menu_id && meal_id) {
      return await handleMealBooking(supabase, authUser, body);
    }

    if (!menu_id) {
      return NextResponse.json({ error: 'Missing required field: menu_id' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // CRITICAL: Ensure we use a valid token for the Edge function. 
    // If we only have the service role key, the Edge function's getUser() will fail.
    const edgeToken = authToken ?? serviceRoleKey;
    
    console.error('[BOOKING_DEBUG_V5] Calling Edge Function...', { 
      action: 'create',
      usingServiceKey: edgeToken === serviceRoleKey 
    });

    const edgeRes = await fetch(
      `${supabaseUrl}/functions/v1/booking-manager?action=create`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${edgeToken}`,
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        },
        body: JSON.stringify({
          menu_id,
          date_time,
          guests_count: Number(guests_count),
          address,
          special_requests,
          payment_model: payment_model ?? 'full_digital',
        }),
      }
    );

    const result = await edgeRes.json();

    if (!edgeRes.ok) {
      console.error('[BOOKING_DEBUG_V5] Edge Function Error:', edgeRes.status, result);
      return NextResponse.json(
        { error: result.error || 'Failed to create booking', edge_status: edgeRes.status },
        { status: edgeRes.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking: { id: result.booking_id },
        payment_url: result.payment_url,
        deposit_amount: result.deposit_amount,
        chef_queue_count: result.chef_queue_count,
        sla_expires_at: result.sla_expires_at,
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('[api/bookings POST]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// ── Legacy meal-only booking path ────────────────────────────────────────────
async function handleMealBooking(supabase: any, user: any, body: any) {
  const { meal_id, date_time, guests_count, address, special_requests } = body;

  if (!date_time || !guests_count || !address) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { data: meal, error: mealError } = await supabase
    .from('meals').select('id, price, name').eq('id', meal_id).single();

  if (mealError || !meal) {
    return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
  }

  const guestCount = Number(guests_count);
  const total_price = Number(meal.price || 0) * guestCount;

  const dateTime = new Date(date_time);
  if (isNaN(dateTime.getTime()) || dateTime < new Date()) {
    return NextResponse.json({ error: 'Invalid or past date/time' }, { status: 400 });
  }

  // Find a chef who owns this meal (if any) or any available chef
  // For V3, we want to assign a chef so it's visible.
  // We'll try to find the first available chef as a fallback.
  const { data: firstChef } = await supabase
    .from('chefs')
    .select('id')
    .in('onboarding_status', ['approved', 'pending_verification'])
    .limit(1)
    .single();

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      client_id: user.id,
      meal_id,
      chef_id: firstChef?.id || null, // ASSIGN A CHEF
      date_time,
      address,
      guests_count: guestCount,
      total_price,
      special_requests: special_requests ?? null,
      status: 'rotating',
    })
    .select()
    .single();

  if (bookingError) {
    console.error('[handleMealBooking] insert error', bookingError);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }

  return NextResponse.json({ success: true, booking }, { status: 201 });
}
