'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { FeaturedExperience } from '@/types/marketplace';

function mapRow(r: Record<string, unknown>, startingPrice: number | null): FeaturedExperience {
  return {
    id: String(r.id),
    name: String(r.name),
    description: r.description != null ? String(r.description) : null,
    category: String(r.category),
    image_url: r.image_url != null ? String(r.image_url) : null,
    is_featured: Boolean(r.is_featured),
    status: (r.status as FeaturedExperience['status']) ?? 'draft',
    slug: r.slug != null ? String(r.slug) : null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
    startingPrice,
  };
}

export function useFeaturedExperiences() {
  const [experiences, setExperiences] = useState<FeaturedExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: expData, error: expError } = await supabase
      .from('experiences')
      .select('*')
      .eq('is_featured', true)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(16);

    if (expError) {
      setError(expError.message ?? 'Failed to fetch experiences');
      setExperiences([]);
      setLoading(false);
      return;
    }

    const list = expData ?? [];
    if (list.length === 0) {
      setExperiences([]);
      setLoading(false);
      return;
    }

    const ids = list.map((r) => r.id);
    const { data: menuData } = await supabase
      .from('menus')
      .select('experience_id, base_price, price_per_person, guest_min')
      .eq('status', 'active')
      .in('experience_id', ids);

    const minByExp: Record<string, number> = {};
    (menuData ?? []).forEach((m) => {
      const eid = String(m.experience_id);
      const basePrice = Number(m.base_price ?? 0);
      const perPerson = Number(m.price_per_person);
      const guestMin = Number(m.guest_min ?? 1);
      // Starting price is base + (price per person * minimum guests)
      const totalPrice = basePrice + (perPerson * guestMin);
      if (!(eid in minByExp) || totalPrice < minByExp[eid]) minByExp[eid] = totalPrice;
    });

    setExperiences(
      list.map((r) => mapRow(r, minByExp[String(r.id)] ?? null))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { experiences, loading, error, refetch: fetch };
}
