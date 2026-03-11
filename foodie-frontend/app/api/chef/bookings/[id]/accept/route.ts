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
  const body = await request.json().catch(() => ({}));
  const responseTimeSeconds = body.response_time_seconds ?? 0;

  try {
    // Verify the user is a chef
    const { data: chef, error: chefErr } = await supabase
      .from('chefs')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (chefErr || !chef) {
      return NextResponse.json({ error: 'Chef profile not found' }, { status: 403 });
    }

    // Verify this booking is assigned to this chef
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, status, chef_id, sla_expires_at')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.chef_id !== chef.id) {
      return NextResponse.json({ error: 'Not authorized to accept this booking' }, { status: 403 });
    }

    if (!['rotating', 'assigned'].includes(booking.status)) {
      return NextResponse.json({ 
        error: `Cannot accept booking in status: ${booking.status}` 
      }, { status: 400 });
    }

    if (booking.sla_expires_at && new Date(booking.sla_expires_at) < new Date()) {
      return NextResponse.json({ error: 'SLA window has expired' }, { status: 400 });
    }

    // Call booking-manager edge function to accept
    const edgeRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/booking-manager?action=accept`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking_id: bookingId,
          chef_user_id: user.id,
          response_time_seconds: responseTimeSeconds,
        }),
      }
    );

    const result = await edgeRes.json();

    if (!edgeRes.ok) {
      return NextResponse.json({ error: result.error || 'Failed to accept booking' }, { status: edgeRes.status });
    }

    return NextResponse.json({ success: true, booking_id: bookingId, status: 'confirmed' });
  } catch (err: any) {
    console.error('[chef/bookings/accept]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
