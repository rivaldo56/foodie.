'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Experience, Menu } from '@/types/marketplace';

function mapExpRow(r: Record<string, unknown>): Experience {
  return {
    id: String(r.id),
    name: String(r.name),
    description: r.description != null ? String(r.description) : null,
    category: String(r.category),
    image_url: r.image_url != null ? String(r.image_url) : null,
    is_featured: Boolean(r.is_featured),
    status: (r.status as Experience['status']) ?? 'draft',
    slug: r.slug != null ? String(r.slug) : null,
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

function mapMenuRow(r: Record<string, unknown>): Menu {
  return {
    id: String(r.id),
    experience_id: String(r.experience_id),
    name: String(r.name),
    description: r.description != null ? String(r.description) : null,
    base_price: Number(r.base_price ?? 0),
    price_per_person: Number(r.price_per_person),
    guest_min: Number(r.guest_min),
    guest_max: Number(r.guest_max),
    dietary_tags: Array.isArray(r.dietary_tags) ? (r.dietary_tags as string[]) : [],
    image_url: r.image_url != null ? String(r.image_url) : null,
    status: (r.status as Menu['status']) ?? 'active',
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

export function useExperienceDetails(slugOrId: string | null) {
  const [experience, setExperience] = useState<Experience | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!slugOrId) {
      setExperience(null);
      setMenus([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const expQuery = isUuid
      ? supabase.from('experiences').select('*').eq('id', slugOrId).single()
      : supabase.from('experiences').select('*').eq('slug', slugOrId).eq('status', 'published').single();

    const { data: expData, error: expError } = await expQuery;

    if (expError || !expData) {
      setError(expError?.message ?? 'Experience not found');
      setExperience(null);
      setMenus([]);
      setLoading(false);
      return;
    }

    setExperience(mapExpRow(expData));
    const expId = String(expData.id);

    const { data: menuData, error: menuError } = await supabase
      .from('menus')
      .select('*')
      .eq('experience_id', expId)
      .eq('status', 'active')
      .order('base_price', { ascending: true });

    if (menuError) {
      setMenus([]);
    } else {
      // Sort by total price (base + per_person) after fetching
      const mapped = (menuData ?? []).map(mapMenuRow);
      mapped.sort((a, b) => (a.base_price + a.price_per_person) - (b.base_price + b.price_per_person));
      setMenus(mapped);
    }
    setLoading(false);
  }, [slugOrId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  return { experience, menus, loading, error, refetch: fetchDetails };
}
