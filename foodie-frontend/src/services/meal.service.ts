import { supabase } from '@/lib/supabase';

export interface Meal {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  kcal: number | null;
  category: 'starter' | 'main' | 'dessert' | 'side' | 'drink';
  cuisine_type: string | null;
  dietary_tags: string[];
  price: number | null;
  total_bookings: number;
  average_rating: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuMeal extends Meal {
  order_index: number;
  course_type: 'starter' | 'main' | 'dessert';
}

export const mealService = {
  async getMeals() {
    return supabase
      .from('meals')
      .select('*')
      .order('created_at', { ascending: false });
  },

  async getMealById(id: string) {
    return supabase
      .from('meals')
      .select('*')
      .eq('id', id)
      .single();
  },

  async createMeal(meal: Omit<Meal, 'id' | 'created_at' | 'total_bookings' | 'average_rating'>) {
    return supabase
      .from('meals')
      .insert([meal])
      .select()
      .single();
  },

  async updateMeal(id: string, updates: Partial<Meal>) {
    return supabase
      .from('meals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  async deleteMeal(id: string) {
    return supabase
      .from('meals')
      .delete()
      .eq('id', id);
  },

  async uploadMealImage(file: File, mealId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${mealId}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('meals')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('meals')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  async getMealsByCategory(category: string) {
    return supabase
      .from('meals')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');
  },

  async getMenuMeals(menuId: string) {
    return supabase
      .from('menu_meals')
      .select(`
        *,
        meal:meals(*)
      `)
      .eq('menu_id', menuId)
      .order('order_index');
  },

  async assignMealsToMenu(menuId: string, meals: { meal_id: string; course_type: string; order_index: number }[]) {
    // First, delete existing assignments
    await supabase.from('menu_meals').delete().eq('menu_id', menuId);

    // Then insert new ones
    if (meals.length > 0) {
      return supabase.from('menu_meals').insert(
        meals.map(m => ({ ...m, menu_id: menuId }))
      );
    }
    return { data: [], error: null };
  },

  async incrementMealBookings(mealIds: string[]) {
    // Using a RPC or multiple updates if RPC not available. 
    // For simplicity, let's assume we might need a custom RPC but here we'll do individual updates.
    const promises = mealIds.map(id => 
      supabase.rpc('increment_meal_bookings', { meal_id_input: id })
    );
    // Note: If increment_meal_bookings RPC doesn't exist, this will fail.
    // I should probably add the RPC to the migration.
    return Promise.all(promises);
  }
};
