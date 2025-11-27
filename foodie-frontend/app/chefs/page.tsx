'use client';

import { useEffect, useMemo, useState } from 'react';
import { Chef, getChefs } from '@/services/chef.service';
import { mockChefs } from '@/lib/api';
import { stableScore } from '@/lib/utils';
import ChefCard from '@/components/ChefCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import FilterChip from '@/components/FilterChip';
import SearchBar from '@/components/SearchBar';
import BottomDock from '@/components/BottomDock';
import {
  Flame,
  Leaf,
  Soup,
  Sparkle,
  Utensils,
} from 'lucide-react';

const CATEGORIES = [
  { label: 'Trending', value: 'trending', icon: Sparkle },
  { label: 'Hot', value: 'hot', icon: Flame },
  { label: 'New Chef', value: 'new', icon: Leaf },
  { label: 'Special', value: 'special', icon: Utensils },
  { label: 'Taste of Magic', value: 'magic', icon: Soup },
  { label: 'Hot & Spicy', value: 'spicy', icon: Flame },
];

export default function ChefsPage() {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string>('trending');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchChefs = async () => {
      setLoading(true);
      const response = await getChefs();

      if (response.data) {
        setChefs(response.data);
      } else {
        setChefs(mockChefs);
        setError('Using mock data while the kitchen warms up.');
      }

      setLoading(false);
    };

    fetchChefs();
  }, []);

  const filteredChefs = useMemo(() => {
    const lower = search.toLowerCase();

    return chefs.filter((chef) => {
      const matchesSearch =
        !lower ||
        chef.user?.full_name?.toLowerCase().includes(lower) ||
        chef.specialties?.some(s => s.toLowerCase().includes(lower)) ||
        chef.bio?.toLowerCase().includes(lower);

      const matchesCategory =
        category === 'trending' || stableScore(`${category}-${chef.id}`, 0, 100) > 40;

      return matchesSearch && matchesCategory;
    });
  }, [chefs, search, category]);

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
            <p className="text-sm font-semibold text-accent uppercase tracking-[0.35em]">Discover Chefs</p>
            <h1 className="text-4xl font-semibold text-white">Browse 12 remarkable chefs and their signature dishes</h1>
            <p className="text-sm text-muted max-w-2xl">
              Each chef brings a distinct culinary story. Filter by mood, spice level, or speciality to plan your next unforgettable dining experience.
            </p>
          </div>

          <SearchBar placeholder="Search dishes, chefs, or cuisines..." onSearch={setSearch} />

          <div className="flex flex-wrap items-center gap-3">
            {CATEGORIES.map((item) => (
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

        {error && (
          <div className="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
            {error}
          </div>
        )}

        <section className="space-y-4">
          <p className="text-xs uppercase tracking-[0.5em] text-muted">
            Showing {filteredChefs.length} of {chefs.length} chefs
          </p>

          {filteredChefs.length === 0 ? (
            <div className="rounded-3xl bg-surface-elevated soft-border px-8 py-16 text-center text-muted">
              No chefs found for this filter. Try adjusting your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredChefs.map((chef) => (
                <ChefCard key={chef.id} chef={chef} />
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomDock />
    </div>
  );
}
