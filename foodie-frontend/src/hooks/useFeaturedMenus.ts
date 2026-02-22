'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Menu } from '@/types/marketplace';

export function useFeaturedMenus(limit = 4) {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('menus')
      .select('*')
      .eq('status', 'active')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (fetchError) {
      setError(fetchError.message ?? 'Failed to fetch featured menus');
      setMenus([]);
    } else {
      setMenus(data as Menu[] ?? []);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { menus, loading, error, refetch: fetch };
}
