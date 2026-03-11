'use client';

import { useState, useCallback } from 'react';
import { Chef, chefService } from '@/services/chef.service';

export function useChefsAdmin() {
    const [chefs, setChefs] = useState<Chef[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchChefs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await chefService.getAllChefsAdmin();
            if (error) {
                setError(error);
            } else {
                setChefs(data || []);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch chefs');
        } finally {
            setLoading(false);
        }
    }, []);

    const updateChef = async (id: string, updates: Partial<Chef>) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await chefService.updateChefAdmin(id, updates);
            if (error) {
                setError(error);
                return null;
            }
            setChefs(prev => prev.map(c => c.id === id ? data! : c));
            return data;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update chef');
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        chefs,
        loading,
        error,
        fetchChefs,
        updateChef,
    };
}
