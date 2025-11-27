'use client';

import { useEffect, useMemo, useState } from 'react';
import { getMeals, Meal } from '@/services/booking.service';
import { mockMeals } from '@/lib/api';
import MealCard from '@/components/MealCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import SearchBar from '@/components/SearchBar';
import FilterChip from '@/components/FilterChip';
import BottomDock from '@/components/BottomDock';
import ChatAssistantFab from '@/components/ChatAssistantFab';
import {
  Beef,
  Flame,
  Leaf,
  Soup,
  Utensils,
} from 'lucide-react';

const MEAL_CATEGORIES = [
  { label: 'All', value: 'all', icon: Utensils },
  { label: 'Swahili Classics', value: 'Swahili Coast', icon: Soup },
  { label: 'Nyama Choma', value: 'Nyama Choma', icon: Flame },
  { label: 'Fine Dining', value: 'Fine Dining', icon: Beef },
  { label: 'Vegan & Fresh', value: 'Vegan', icon: Leaf },
  { label: 'Seafood', value: 'Seafood', icon: Soup },
];

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  useEffect(() => {
    const fetchMeals = async () => {
      setLoading(true);
      const response = await getMeals();

      const data = response.data ?? mockMeals;
      setMeals(data);
      setLoading(false);
    };

    fetchMeals();
  }, []);

  const filteredMeals = useMemo(() => {
    const lower = search.toLowerCase();

    return meals.filter((meal) => {
      const matchesCategory = category === 'all' || meal.category.toLowerCase().includes(category.toLowerCase());
      const matchesSearch =
        !lower ||
        meal.name.toLowerCase().includes(lower) ||
        meal.category.toLowerCase().includes(lower) ||
        meal.description?.toLowerCase().includes(lower);

      return matchesCategory && matchesSearch;
    });
  }, [meals, category, search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 py-10">
        <header className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-accent uppercase tracking-[0.35em]">Discover Dishes</p>
            <h1 className="text-4xl font-semibold text-white">Curated meals tailored to your flavour palette</h1>
            <p className="text-sm text-muted max-w-2xl">
              Filter by cuisine, spice level, or dietary preference. Every dish is chef-prepared, plated beautifully, and ready to delight your guests.
            </p>
          </div>

          <SearchBar onSearch={setSearch} placeholder="Search dishes, chefs, or cuisines..." />

          <div className="flex flex-wrap items-center gap-3">
            {MEAL_CATEGORIES.map((item) => (
              <FilterChip
                key={item.value}
                label={item.label}
                icon={item.icon}
                active={category === item.value}
                onClick={() => setCategory(item.value)}
              />
            ))}
          </div>
        </header>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
            <span className="uppercase tracking-[0.5em]">Showing {filteredMeals.length} of {meals.length} meals</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-surface-highlight px-4 py-2 text-[11px]">
              ⚡ Matched using your foodie profile
            </span>
          </div>

          {filteredMeals.length === 0 ? (
            <div className="rounded-3xl bg-surface-elevated soft-border px-8 py-16 text-center text-muted">
              No meals found. Try a different filter or keyword.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMeals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          )}
        </section>
      </main>

      <ChatAssistantFab />
      <BottomDock />
    </div>
  );
}
