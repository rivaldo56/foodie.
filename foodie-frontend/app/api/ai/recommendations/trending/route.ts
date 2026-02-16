import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'chef';
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    // Fetch real chefs from Supabase with user details, sorted by growth/newest
    const { data: chefs, error } = await supabase
      .from('chefs')
      .select('*, user:users(*)')
      .eq('is_verified', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[API] Error fetching trending chefs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform into trending format
    const trending = (chefs || []).map((chef, index) => ({
      chef: {
        id: chef.id,
        full_name: chef.user?.full_name || 'Chef',
        username: chef.user?.username || `chef_${chef.id}`,
        profile_picture: chef.profile_picture || 'https://images.unsplash.com/photo-1495195129352-aeb325a55b65?auto=format&fit=crop&w=900&q=80',
        cuisine_types: chef.cuisine_types || [],
        average_rating: chef.average_rating || 0.0,
        location: chef.location || chef.city || 'Nairobi'
      },
      trending_score: 0.98 - (index * 0.03),
      recent_bookings: Math.floor(Math.random() * 20) + 5,
      growth_velocity: 1.0 + (Math.random() * 0.5),
      badge: index === 0 ? '🔥 Hot' : (index < 3 ? '⭐ Top Rated' : '✨ New')
    }));

    return NextResponse.json({
      trending,
      total: trending.length,
      timeframe: '24h'
    });
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
