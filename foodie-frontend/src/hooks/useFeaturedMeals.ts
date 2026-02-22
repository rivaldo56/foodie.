'use client';

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useFeaturedMeals(limit = 10) {
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('meals')
      .select('*')
      .eq('is_active', true)
      .order('total_bookings', { ascending: false })
      .limit(limit);

    if (fetchError) {
      setError(fetchError.message ?? 'Failed to fetch featured meals');
      setMeals([]);
    } else {
      setMeals(data ?? []);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { meals, loading, error, refetch: fetch };
}
