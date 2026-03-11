import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: bookingId } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const { reason, response_time_seconds = 0 } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Decline reason is required' }, { status: 400 });
    }

    // Verify chef profile
    const { data: chef, error: chefErr } = await supabase
      .from('chefs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (chefErr || !chef) {
      return NextResponse.json({ error: 'Chef profile not found' }, { status: 403 });
    }

    // Verify booking assignment
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, status, chef_id')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.chef_id !== chef.id) {
      return NextResponse.json({ error: 'Not authorized to decline this booking' }, { status: 403 });
    }

    if (!['rotating', 'assigned'].includes(booking.status)) {
      return NextResponse.json({ 
        error: `Cannot decline booking in status: ${booking.status}` 
      }, { status: 400 });
    }

    // Call booking-manager edge function to decline and rotate
    const edgeRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking-manager?action=decline`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          chef_user_id: user.id,
          reason,
          response_time_seconds,
        }),
      }
    );

    const result = await edgeRes.json();

    if (!edgeRes.ok) {
      return NextResponse.json({ error: result.error || 'Failed to process decline' }, { status: edgeRes.status });
    }

    return NextResponse.json({ 
      success: true, 
      booking_id: bookingId,
      rotated_to: result.rotated_to ?? null,
      message: result.message ?? 'Booking declined',
    });
  } catch (err: any) {
    console.error('[chef/bookings/decline]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
