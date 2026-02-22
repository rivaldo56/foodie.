import { useState, useCallback } from 'react';
import { mealService, Meal } from '@/services/meal.service';

export function useMealsAdmin() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await mealService.getMeals();
      if (fetchError) throw fetchError;
      setMeals(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch meals');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMeal = async (id: string) => {
    try {
      const { error: deleteError } = await mealService.deleteMeal(id);
      if (deleteError) throw deleteError;
      setMeals(prev => prev.filter(m => m.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete meal');
      return false;
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await mealService.updateMeal(id, { is_active: !currentStatus });
      if (updateError) throw updateError;
      setMeals(prev => prev.map(m => m.id === id ? { ...m, is_active: !currentStatus } : m));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update meal status');
      return false;
    }
  };

  return {
    meals,
    loading,
    error,
    fetchMeals,
    deleteMeal,
    toggleActive,
  };
}
