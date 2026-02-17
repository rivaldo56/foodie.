import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { menu_id, date_time, guests_count, address, special_requests } = body;

    if (!menu_id || !date_time || !guests_count || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: menu, error: menuError } = await supabase
      .from('menus')
      .select('id, experience_id, base_price, price_per_person, guest_min, guest_max, status')
      .eq('id', menu_id)
      .single();

    if (menuError || !menu) {
      return NextResponse.json({ error: 'Menu not found' }, { status: 404 });
    }

    if (menu.status !== 'active') {
      return NextResponse.json({ error: 'Menu is not available for booking' }, { status: 400 });
    }

    const guestCount = Number(guests_count);
    if (guestCount < menu.guest_min || guestCount > menu.guest_max) {
      return NextResponse.json({
        error: `Guest count must be between ${menu.guest_min} and ${menu.guest_max}`,
      }, { status: 400 });
    }

    const dateTime = new Date(date_time);
    if (isNaN(dateTime.getTime())) {
      return NextResponse.json({ error: 'Invalid date or time' }, { status: 400 });
    }
    if (dateTime < new Date()) {
      return NextResponse.json({ error: 'Booking date and time must be in the future' }, { status: 400 });
    }

    // Dual pricing model: total_price = base_price + (price_per_person × guests_count)
    // Never trust client-submitted price
    const basePrice = Number(menu.base_price ?? 0);
    const pricePerPerson = Number(menu.price_per_person);
    const total_price = basePrice + (pricePerPerson * guestCount);

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          client_id: user.id,
          menu_id,
          experience_id: menu.experience_id ?? null,
          date_time: date_time,
          address,
          guests_count: guestCount,
          total_price,
          special_requests: special_requests ?? null,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (bookingError) {
      console.error('Booking Insert Error:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    return NextResponse.json({ success: true, booking }, { status: 201 });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
