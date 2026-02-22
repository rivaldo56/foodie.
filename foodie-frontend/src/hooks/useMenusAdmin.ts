'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Menu, Experience, CreateMenuInput, UpdateMenuInput } from '@/types/marketplace';

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
    featured: Boolean(r.featured ?? false),
    is_instant_book: Boolean(r.is_instant_book ?? false),
    created_at: String(r.created_at),
    updated_at: String(r.updated_at),
  };
}

export function useMenusAdmin(experienceId: string | null) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMenus = useCallback(async () => {
    if (!experienceId) {
      setMenus([]);
      setExperience(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const [expRes, menuRes] = await Promise.all([
      supabase.from('experiences').select('*').eq('id', experienceId).single(),
      supabase
        .from('menus')
        .select('*')
        .eq('experience_id', experienceId)
        .order('price_per_person', { ascending: true }),
    ]);

    if (expRes.data) {
      setExperience({
        id: String(expRes.data.id),
        name: String(expRes.data.name),
        description: expRes.data.description != null ? String(expRes.data.description) : null,
        category: String(expRes.data.category),
        image_url: expRes.data.image_url != null ? String(expRes.data.image_url) : null,
        is_featured: Boolean(expRes.data.is_featured),
        status: (expRes.data.status as Experience['status']) ?? 'draft',
        slug: expRes.data.slug != null ? String(expRes.data.slug) : null,
        created_at: String(expRes.data.created_at),
        updated_at: String(expRes.data.updated_at),
      });
    } else {
      setExperience(null);
    }

    if (menuRes.error) {
      setError(menuRes.error.message ?? 'Failed to fetch menus');
      setMenus([]);
    } else {
      setMenus((menuRes.data ?? []).map(mapMenuRow));
    }
    setLoading(false);
  }, [experienceId]);

  useEffect(() => {
    fetchMenus();
  }, [fetchMenus]);

  const createMenu = useCallback(
    async (input: CreateMenuInput): Promise<{ id: string } | null> => {
      setError(null);
      const { data, error: e } = await supabase
        .from('menus')
        .insert([{ ...input, status: input.status ?? 'active' }])
        .select('id')
        .single();

      if (e) {
        setError(e.message ?? 'Failed to create menu');
        return null;
      }
      await fetchMenus();
      return data ? { id: String(data.id) } : null;
    },
    [fetchMenus]
  );

  const updateMenu = useCallback(
    async (id: string, input: UpdateMenuInput): Promise<boolean> => {
      setError(null);
      const { error: e } = await supabase.from('menus').update(input).eq('id', id);

      if (e) {
        setError(e.message ?? 'Failed to update menu');
        return false;
      }
      await fetchMenus();
      return true;
    },
    [fetchMenus]
  );

  const deleteMenu = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      const { error: e } = await supabase.from('menus').delete().eq('id', id);

      if (e) {
        setError(e.message ?? 'Failed to delete menu');
        return false;
      }
      await fetchMenus();
      return true;
    },
    [fetchMenus]
  );

  const toggleActive = useCallback(
    async (id: string): Promise<boolean> => {
      const menu = menus.find((m) => m.id === id);
      if (!menu) return false;
      const nextStatus = menu.status === 'active' ? 'inactive' : 'active';
      return updateMenu(id, { status: nextStatus });
    },
    [menus, updateMenu]
  );

  return {
    menus,
    experience,
    loading,
    error,
    fetchMenus,
    createMenu,
    updateMenu,
    deleteMenu,
    toggleActive,
  };
}
