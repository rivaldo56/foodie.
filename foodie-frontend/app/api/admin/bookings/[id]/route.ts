import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const ALLOWED_STATUSES = ['pending', 'confirmed', 'in_progress', 'completed', 'canceled'] as const;

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // JWT-only admin check
  const userRole = user.app_metadata?.role;
  if (userRole !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { status?: string };
  try {
    body = await _request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const status = body.status;
  if (!status || !ALLOWED_STATUSES.includes(status as (typeof ALLOWED_STATUSES)[number])) {
    return NextResponse.json(
      { error: `status must be one of: ${ALLOWED_STATUSES.join(', ')}` },
      { status: 400 }
    );
  }

  const { data: booking, error: updateError } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (updateError) {
    console.error('Booking update error:', updateError);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }

  return NextResponse.json(booking);
}
