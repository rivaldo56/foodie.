import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// GET – fetch chef's own availability rules
export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: chef } = await supabase.from('chefs').select('id').eq('user_id', user.id).single();
  if (!chef) return NextResponse.json({ error: 'Chef not found' }, { status: 404 });

  const { data, error } = await supabase
    .from('chef_availability')
    .select('*')
    .eq('chef_id', chef.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

// POST – upsert availability rule
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: chef } = await supabase.from('chefs').select('id').eq('user_id', user.id).single();
  if (!chef) return NextResponse.json({ error: 'Chef not found' }, { status: 404 });

  const body = await request.json();
  const { type, start_at, end_at, day_of_week, available_from, available_until, service_type, notes } = body;

  if (!type) return NextResponse.json({ error: 'Missing field: type' }, { status: 400 });

  const { data, error } = await supabase
    .from('chef_availability')
    .insert({ chef_id: chef.id, type, start_at, end_at, day_of_week, available_from, available_until, service_type, notes })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}

// DELETE – remove an availability rule by id
export async function DELETE(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: chef } = await supabase.from('chefs').select('id').eq('user_id', user.id).single();
  if (!chef) return NextResponse.json({ error: 'Chef not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id param' }, { status: 400 });

  const { error } = await supabase
    .from('chef_availability')
    .delete()
    .eq('id', id)
    .eq('chef_id', chef.id); // RLS double-check

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
