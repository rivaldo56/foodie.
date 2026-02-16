import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'chef';
  const limit = parseInt(searchParams.get('limit') || '10');

  console.log(`[API] AI Recommendations Feed requested - Type: ${type}, Limit: ${limit}`);

  try {
    // Fetch real chefs from Supabase with user details
    const { data: chefs, error } = await supabase
      .from('chefs')
      .select('*, user:users(*)')
      .eq('is_verified', true)
      .limit(limit);

    if (error) {
      console.error('[API] Error fetching chefs:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform into recommendation format
    // Real recommendation logic would happen here or in an Edge Function
    const recommendations = (chefs || []).map((chef, index) => ({
      chef: {
        id: chef.id,
        full_name: chef.user?.full_name || 'Chef',
        username: chef.user?.username || `chef_${chef.id}`,
        profile_picture: chef.profile_picture || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
        cuisine_types: chef.cuisine_types || [],
        average_rating: chef.average_rating || 0.0,
        location: chef.location || chef.city || 'Nairobi',
        bio: chef.bio || ''
      },
      recommendation_score: 0.95 - (index * 0.02),
      score_breakdown: {
        collaborative: 0.9,
        content_based: 0.9,
        popularity: 0.8,
        recency: 0.8,
        diversity: 0.7
      }
    }));

    return NextResponse.json({
      recommendations,
      total: recommendations.length,
      algorithm: 'live-supabase-query-v1'
    });
  } catch (err) {
    console.error('[API] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
