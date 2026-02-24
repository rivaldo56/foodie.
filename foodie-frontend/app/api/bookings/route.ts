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
    const { menu_id, meal_id, date_time, guests_count, address, special_requests } = body;

    if ((!menu_id && !meal_id) || !date_time || !guests_count || !address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let total_price = 0;
    let experience_id = null;

    if (menu_id) {
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

        const basePrice = Number(menu.base_price ?? 0);
        const pricePerPerson = Number(menu.price_per_person);
        total_price = basePrice + (pricePerPerson * guestCount);
        experience_id = menu.experience_id;
    } else if (meal_id) {
        const { data: meal, error: mealError } = await supabase
          .from('meals')
          .select('id, price, name')
          .eq('id', meal_id)
          .single();

        if (mealError || !meal) {
          return NextResponse.json({ error: 'Meal not found' }, { status: 404 });
        }

        const guestCount = Number(guests_count);
        const mealPrice = Number(meal.price ?? 0);
        total_price = mealPrice * guestCount;
    }

    const dateTime = new Date(date_time);
    if (isNaN(dateTime.getTime())) {
      return NextResponse.json({ error: 'Invalid date or time' }, { status: 400 });
    }
    if (dateTime < new Date()) {
      return NextResponse.json({ error: 'Booking date and time must be in the future' }, { status: 400 });
    }

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          client_id: user.id,
          menu_id: menu_id || null,
          meal_id: meal_id || null,
          experience_id: experience_id ?? null,
          date_time: date_time,
          address,
          guests_count: Number(guests_count),
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

    // Increment meal bookings for popularity tracking
    try {
      const { data: menuMeals } = await supabase
        .from('menu_meals')
        .select('meal_id')
        .eq('menu_id', menu_id);

      if (menuMeals && menuMeals.length > 0) {
        const mealIds = menuMeals.map(mm => mm.meal_id);
        const incrementPromises = mealIds.map(id => 
          supabase.rpc('increment_meal_bookings', { meal_id_input: id })
        );
        await Promise.allSettled(incrementPromises);
      }
    } catch (mealError) {
      // Don't fail the booking if tracking fails
      console.error('Failed to increment meal bookings:', mealError);
    }

    return NextResponse.json({ success: true, booking }, { status: 201 });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
