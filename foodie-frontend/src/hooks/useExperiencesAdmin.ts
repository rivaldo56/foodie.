'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Experience, CreateExperienceInput, UpdateExperienceInput } from '@/types/marketplace';

function mapRow(r: Record<string, unknown>): Experience {
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

export function useExperiencesAdmin() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExperiences = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: e } = await supabase
      .from('experiences')
      .select('*')
      .order('created_at', { ascending: false });

    if (e) {
      setError(e.message ?? 'Failed to fetch experiences');
      setExperiences([]);
    } else {
      setExperiences((data ?? []).map(mapRow));
    }
    setLoading(false);
  }, []);

  const createExperience = useCallback(
    async (input: CreateExperienceInput): Promise<{ id: string } | null> => {
      console.log('[useExperiencesAdmin] Creating experience...', { name: input.name });
      setError(null);
      
      try {
        const { data, error: e } = await supabase
          .from('experiences')
          .insert([{ ...input, status: input.status ?? 'draft' }])
          .select('id')
          .single();

        if (e) {
          console.error('[useExperiencesAdmin] Supabase error:', e);
          setError(e.message ?? 'Failed to create experience');
          return null;
        }

        console.log('[useExperiencesAdmin] Experience created successfully:', data?.id);
        
        // Trigger refetch in background, don't await it to avoid blocking the return
        fetchExperiences().catch(err => console.error('[useExperiencesAdmin] Background refetch failed:', err));
        
        return data ? { id: String(data.id) } : null;
      } catch (err) {
        console.error('[useExperiencesAdmin] Unexpected error during creation:', err);
        setError('An unexpected error occurred');
        return null;
      }
    },
    [fetchExperiences]
  );

  const updateExperience = useCallback(
    async (id: string, input: UpdateExperienceInput): Promise<boolean> => {
      setError(null);
      const { error: e } = await supabase.from('experiences').update(input).eq('id', id);

      if (e) {
        setError(e.message ?? 'Failed to update experience');
        return false;
      }
      await fetchExperiences();
      return true;
    },
    [fetchExperiences]
  );

  const deleteExperience = useCallback(
    async (id: string): Promise<boolean> => {
      setError(null);
      const { error: e } = await supabase.from('experiences').delete().eq('id', id);

      if (e) {
        setError(e.message ?? 'Failed to delete experience');
        return false;
      }
      await fetchExperiences();
      return true;
    },
    [fetchExperiences]
  );

  const togglePublish = useCallback(
    async (id: string): Promise<boolean> => {
      const exp = experiences.find((e) => e.id === id);
      if (!exp) return false;
      const nextStatus = exp.status === 'published' ? 'draft' : 'published';
      return updateExperience(id, { status: nextStatus });
    },
    [experiences, updateExperience]
  );

  return {
    experiences,
    loading,
    error,
    fetchExperiences,
    createExperience,
    updateExperience,
    deleteExperience,
    togglePublish,
  };
}
