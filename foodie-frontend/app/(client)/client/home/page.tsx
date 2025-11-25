'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getPersonalizedFeed, trackInteraction } from '@/lib/api/recommendations';
import type { ChefRecommendation } from '@/lib/api/recommendations';
import ChefCard from '@/components/ChefCard';
import { getMenuItems, type MenuItem } from '@/lib/api';
import MenuItemCard from '@/components/MenuItemCard';
import { Search, Sparkles, Loader2 } from 'lucide-react';

export default function ClientHomePage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();
  const [recommendations, setRecommendations] = useState<ChefRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuItemsLoading, setMenuItemsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Infinite scroll states
  const [menuPage, setMenuPage] = useState(1);
  const [hasMoreMenuItems, setHasMoreMenuItems] = useState(true);
  const [loadingMoreMenuItems, setLoadingMoreMenuItems] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
      return;
    }

    if (isAuthenticated) {
      loadRecommendations();
      loadMenuItems(1, true);
    }
  }, [loading, isAuthenticated, router]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreMenuItems && !loadingMoreMenuItems) {
          loadMenuItems(menuPage + 1, false);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMoreMenuItems, loadingMoreMenuItems, menuPage]);

  const loadRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      const response = await getPersonalizedFeed('chef', 20);

      if (response.data) {
        setRecommendations(response.data.recommendations);
      } else if (response.error) {
        setError(response.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const loadMenuItems = async (page: number, isInitial: boolean) => {
    try {
      if (isInitial) {
        setMenuItemsLoading(true);
      } else {
        setLoadingMoreMenuItems(true);
      }

      const response = await getMenuItems();

      if (response.data) {
        // Handle paginated response
        let items: MenuItem[] = [];
        if (Array.isArray(response.data)) {
          items = response.data;
        } else if (response.data && 'results' in response.data) {
          items = (response.data as any).results;
        }

        // Simulate pagination by slicing the array
        const pageSize = 8;
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const paginatedItems = items.slice(start, end);

        if (isInitial) {
          setMenuItems(paginatedItems);
        } else {
          setMenuItems(prev => [...prev, ...paginatedItems]);
        }

        setMenuPage(page);
        setHasMoreMenuItems(end < items.length);
      }
    } catch (err) {
      console.error('[Load Menu Items Error]', err);
    } finally {
      if (isInitial) {
        setMenuItemsLoading(false);
      } else {
        setLoadingMoreMenuItems(false);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/client/discover?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getFirstName = () => {
    if (!user) return 'there';
    const fullName = user.full_name || user.username;
    return fullName.split(' ')[0];
  };

  if (loading || recommendationsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-white/5 rounded-lg w-3/4" />
          <div className="h-10 bg-white/5 rounded-lg w-1/2" />
          <div className="h-12 bg-white/5 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white">
          Welcome back, {getFirstName()} 👋
        </h1>
        <p className="text-white/70 text-lg">
          Discover personalized chef recommendations just for you
        </p>
      </header>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/50" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by cuisine, location, or chef name..."
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
        />
      </form>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl bg-red-900/40 border border-red-500/50 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      {/* AI-Powered Recommendations */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-orange-500" />
          <h2 className="text-2xl font-semibold text-white">AI-Powered Recommendations</h2>
        </div>

        {recommendations.length === 0 && !error ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-white/70 mb-4">No recommendations yet</p>
            <p className="text-sm text-white/50">
              Start exploring chefs to get personalized recommendations
            </p>
            <button
              onClick={() => router.push('/client/discover')}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-white font-semibold hover:bg-orange-600 transition"
            >
              Discover Chefs
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {recommendations.map((rec) => (
                <div key={rec.chef.id} className="w-[300px] flex-shrink-0">
                  <ChefCard
                    chef={rec.chef}
                    matchScore={rec.recommendation_score}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Featured Dishes */}
      <section className="space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <h2 className="text-xl sm:text-2xl font-semibold text-white">Featured Dishes</h2>
          </div>
          <button
            onClick={() => router.push('/client/discover')}
            className="text-sm sm:text-base text-orange-500 hover:text-orange-400 transition font-medium"
          >
            View All →
          </button>
        </div>

        {menuItemsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-80 bg-white/5 rounded-2xl sm:rounded-3xl" />
            ))}
          </div>
        ) : menuItems.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {menuItems.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 sm:p-12 text-center">
            <p className="text-white/70 mb-4">No dishes available yet</p>
            <p className="text-sm text-white/50">
              Check back soon for amazing culinary creations
            </p>
          </div>
        )}

        {/* Infinite Scroll Loading Indicator */}
        {loadingMoreMenuItems && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
            <span className="ml-3 text-white/70">Loading more dishes...</span>
          </div>
        )}

        {/* Infinite Scroll Observer Target */}
        <div ref={observerTarget} className="h-4" />
      </section>
    </div>
  );
}
