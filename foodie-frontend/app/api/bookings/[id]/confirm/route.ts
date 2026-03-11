import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bookingId = params.id;

  try {
    // Verify this booking belongs to this client
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .select('id, client_id, status, chef_id')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.client_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (booking.status !== 'completed' && booking.status !== 'awaiting_client_confirmation') {
      return NextResponse.json({
        error: `Cannot confirm satisfaction for booking in status: ${booking.status}`,
      }, { status: 400 });
    }

    // Mark client confirmation on booking
    await supabase
      .from('bookings')
      .update({ confirmed_by_client_at: new Date().toISOString() })
      .eq('id', bookingId);

    // Trigger escrow release via edge function
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const releaseRes = await fetch(
        `${supabaseUrl}/functions/v1/escrow-release-manager`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ booking_id: bookingId, force: true }),
        }
      );
      const releaseData = await releaseRes.json();
      console.log('[confirm] Escrow release result:', releaseData);
    }

    return NextResponse.json({ success: true, message: 'Satisfaction confirmed. Payout initiated.' });
  } catch (err: any) {
    console.error('[bookings/confirm]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
