'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Menu, Experience } from '@/types/marketplace';

export interface MenuWithExperience extends Menu {
  experience: {
    name: string;
  };
}

function mapMenuRow(r: any): MenuWithExperience {
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
    experience: {
      name: r.experience?.name ?? 'Unknown Experience'
    }
  };
}

export function useAllMenusAdmin() {
  const [menus, setMenus] = useState<MenuWithExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenus = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: e } = await supabase
      .from('menus')
      .select(`
        *,
        experience:experiences (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (e) {
      setError(e.message ?? 'Failed to fetch menus');
      setMenus([]);
    } else {
      setMenus((data ?? []).map(mapMenuRow));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const toggleActive = async (id: string) => {
    const menu = menus.find((m) => m.id === id);
    if (!menu) return false;
    const nextStatus = menu.status === 'active' ? 'inactive' : 'active';
    
    const { error: e } = await supabase
      .from('menus')
      .update({ status: nextStatus })
      .eq('id', id);

    if (e) return false;
    await fetchMenus();
    return true;
  };

  const deleteMenu = async (id: string) => {
    const { error: e } = await supabase.from('menus').delete().eq('id', id);
    if (e) return false;
    await fetchMenus();
    return true;
  };

  return {
    menus,
    loading,
    error,
    fetchMenus,
    toggleActive,
    deleteMenu
  };
}
