'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Flame, Leaf, Star, SlidersHorizontal, Wand2 } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import MealCard from '@/components/MealCard';
import BottomDock from '@/components/BottomDock';
import { getDiscoverFeed, mockMeals, type Meal } from '@/lib/api';

const CATEGORY_CHIPS: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: 'All', value: 'all', icon: Sparkles },
  { label: 'Popular', value: 'popular', icon: Star },
  { label: 'Vegan', value: 'vegan', icon: Leaf },
  { label: 'New', value: 'new', icon: Wand2 },
  { label: 'Hot & Spicy', value: 'spicy', icon: Flame },
];

const SKELETON_ITEMS = Array.from({ length: 6 });

export default function DiscoverPage() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchMeals = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getDiscoverFeed({ limit: 12 });
        const data = response.data && Array.isArray(response.data) ? response.data : [];

        if (!isMounted) return;

        if (!data.length) {
          setMeals(mockMeals);
          setError('Tunakuonyesha chaguo za mfano kwa sasa.');
        } else {
          setMeals(data);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[Foodie] Discover fetch error:', err);
        setMeals(mockMeals);
        setError('Hatukuweza kupakia mapendekezo ya karibuni.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMeals();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredMeals = useMemo(() => {
    let list = [...meals];

    if (selectedCategory !== 'all') {
      const category = selectedCategory.toLowerCase();

      if (category === 'popular') {
        list = list.filter((meal) => (meal.rating ?? 0) >= 4.5);
      } else if (category === 'new') {
        list = list.slice(0, 8);
      } else if (category === 'spicy') {
        list = list.filter((meal) => {
          const haystack = `${meal.name ?? ''} ${meal.description ?? ''}`.toLowerCase();
          return haystack.includes('spicy') || haystack.includes('pilipili') || haystack.includes('choma');
        });
      } else {
        list = list.filter((meal) => meal.category?.toLowerCase().includes(category));
      }
    }

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      list = list.filter((meal) => {
        const nameMatch = meal.name.toLowerCase().includes(lower);
        const categoryMatch = meal.category?.toLowerCase().includes(lower);
        const descriptionMatch = meal.description?.toLowerCase().includes(lower);
        return nameMatch || categoryMatch || descriptionMatch;
      });
    }

    return list;
  }, [meals, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen pb-32">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 py-10">
        <header className="space-y-4">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-accent uppercase tracking-[0.35em]">
              <Sparkles className="h-4 w-4" />
              Discover
            </p>
            <h1 className="text-4xl font-semibold text-white">Discover Chefs</h1>
            <p className="text-sm text-muted max-w-2xl">
              Browse curated dishes and artisanal experiences tailored to your taste buds.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
            <div className="flex-1">
              <SearchBar placeholder="Search dishes, chefs, or cuisines…" onSearch={setSearchQuery} />
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-surface-highlight px-5 py-3 text-sm font-semibold text-muted hover:bg-surface transition"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-[0.3em] text-muted">Explore by Category</h2>
            {error && (
              <span className="text-xs text-warning">{error}</span>
            )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {CATEGORY_CHIPS.map(({ label, value, icon: Icon }) => {
              const active = selectedCategory === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedCategory(value)}
                  className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition ${
                    active
                      ? 'border-accent bg-accent text-white shadow-glow'
                      : 'border-surface bg-surface-highlight text-muted hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between text-sm text-muted">
            <p>
              Showing <span className="text-white font-semibold">{filteredMeals.length}</span> of{' '}
              <span className="text-white font-semibold">{meals.length}</span> results
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {SKELETON_ITEMS.map((_, index) => (
                <div
                  key={index}
                  className="rounded-3xl soft-border bg-surface-elevated/60 h-72 animate-pulse"
                />
              ))}
            </div>
          ) : filteredMeals.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMeals.map((meal) => (
                <MealCard key={meal.id} meal={meal} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-surface bg-surface/60 p-10 text-center text-sm text-muted">
              <p className="font-medium text-white">Hakuna matokeo kwa sasa.</p>
              <p>Jaribu kubadilisha vigezo vyako vya utafutaji au chagua kipengele kingine.</p>
            </div>
          )}
        </section>
      </main>

      <BottomDock />
    </div>
  );
}
