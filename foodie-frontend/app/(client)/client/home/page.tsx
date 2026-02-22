'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getPersonalizedFeed } from '@/lib/api/recommendations';
import type { ChefRecommendation } from '@/lib/api/recommendations';
import ChefCard from '@/components/ChefCard';
import { Search, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import RecipeFeed from '@/components/recipes/RecipeFeed';
import { usePublishedExperiences } from '@/hooks/usePublishedExperiences';
import { useFeaturedExperiences } from '@/hooks/useFeaturedExperiences';
import { useExploreMenus } from '@/hooks/useExploreMenus';
import { useFeaturedMenus } from '@/hooks/useFeaturedMenus';
import { useExploreMeals } from '@/hooks/useExploreMeals';
import { useFeaturedMeals } from '@/hooks/useFeaturedMeals';
import { SectionHeader, ExperienceCard, MenuCard, MealCard } from '@/components/discovery/DiscoveryComponents';

export default function ClientHomePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [recommendations, setRecommendations] = useState<ChefRecommendation[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Discovery Hooks
  const { experiences, loading: expLoading } = usePublishedExperiences();
  const { experiences: featuredExp, loading: featExpLoading } = useFeaturedExperiences();
  const { menus, loading: menusLoading } = useExploreMenus(10);
  const { menus: featuredMenus, loading: featMenusLoading } = useFeaturedMenus(4);
  const { meals: exploreMeals, loading: mealsLoading } = useExploreMeals(10);
  const { meals: featuredMeals, loading: featMealsLoading } = useFeaturedMeals(10);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth');
      return;
    }

    if (isAuthenticated) {
      loadRecommendations();
    }
  }, [authLoading, isAuthenticated, router]);

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

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 pt-4">
      {/* Top Brand Bar */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8">
            <Image 
              src="/foodie_logo.png" 
              alt="Foodie Logo" 
              fill 
              className="object-contain"
            />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            FOODIE CLIENT
          </span>
        </div>
        <div className="text-[10px] font-medium text-white/30 italic">
          Personalised For Food lovers
        </div>
      </div>

      {/* Welcome Header / Hero */}
      <header className="space-y-4">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Discover experiences
          </h1>
          <p className="text-white/40 text-sm md:text-base font-medium max-w-2xl">
            Concierge-curated journeys just for you
          </p>
        </div>
      </header>

      {/* Explore Experiences */}
      <section className="space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
          {!expLoading ? (
            experiences.slice(0, 4).map((exp) => (
              <ExperienceCard key={exp.id} experience={exp} />
            ))
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-3xl bg-white/5 animate-pulse border border-white/10" />
            ))
          )}
        </div>
      </section>

      {/* Availability Banner - Simplified Fire Emoji Style */}
      <section className="py-8 border-y border-white/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🔥</div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Chefs available today in Nairobi</h3>
              <div className="flex items-center gap-4 text-white/40 text-sm font-medium">
                <span>12 available for dinner</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>8 for meal prep</span>
              </div>
            </div>
          </div>
          <Link 
            href="/client/discover"
            className="px-8 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-bold transition-all transform active:scale-95"
          >
            See available chefs
          </Link>
        </div>
      </section>

      {/* Featured Experiences */}
      <section>
        <SectionHeader 
          title="Featured Experiences" 
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {!featExpLoading ? (
            featuredExp.slice(0, 3).map((exp) => (
              <ExperienceCard key={exp.id} experience={exp} />
            ))
          ) : (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] rounded-3xl bg-white/5 animate-pulse" />
            ))
          )}
        </div>
      </section>

      {/* AI-Powered Recommendations - Moved Below Primary Grid */}
      {recommendations.length > 0 && (
        <section className="space-y-6 pt-8">
          <div className="flex items-center gap-2 px-1">
            <Sparkles className="h-6 w-6 text-accent" />
            <h2 className="text-2xl font-semibold text-white tracking-tight">AI-Powered Recommendations</h2>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 snap-x">
            {recommendations.map((rec) => (
              <div key={rec.chef.id} className="w-[300px] flex-shrink-0 snap-start">
                <ChefCard
                  chef={rec.chef}
                  matchScore={rec.recommendation_score}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Explore Menus */}
      <section>
        <SectionHeader 
          title="Explore Menus" 
          href="/client/discover"
        />
        <div className="flex gap-6 overflow-x-auto pb-8 -mx-6 px-6 scrollbar-hide snap-x">
          {!menusLoading ? (
            menus.map((menu) => (
              <div key={menu.id} className="snap-start flex-shrink-0 w-[240px] md:w-[280px]">
                <MenuCard menu={menu} />
              </div>
            ))
          ) : (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[240px] aspect-video rounded-3xl bg-white/5 animate-pulse" />
            ))
          )}
        </div>
      </section>

      {/* Recipe Inspiration Feed - Preserved */}
      <section className="space-y-6">
          <div className="flex items-center gap-2 px-1">
             <Sparkles className="h-6 w-6 text-accent" />
             <h2 className="text-2xl font-semibold text-white tracking-tight">Daily Inspiration</h2>
          </div>
          <div className="-mx-4 sm:mx-0">
             <RecipeFeed hideHeader={true} />
          </div>
      </section>

      {/* Featured Menus */}
      <section>
        <SectionHeader 
          title="Featured Menus" 
        />
        <div className="flex gap-6 overflow-x-auto pb-8 -mx-6 px-6 scrollbar-hide snap-x">
          {!featMenusLoading ? (
            featuredMenus.map((menu) => (
              <div key={menu.id} className="snap-center">
                <MenuCard menu={menu} premium />
              </div>
            ))
          ) : (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-[300px] aspect-[4/5] rounded-3xl bg-white/5 animate-pulse" />
            ))
          )}
        </div>
      </section>

      {/* Explore Meals */}
      <section>
        <SectionHeader 
          title="Explore Meals" 
          href="/client/discover"
        />
        <div className="flex gap-6 overflow-x-auto pb-8 -mx-6 px-6 scrollbar-hide snap-x">
          {!mealsLoading ? (
            exploreMeals.map((meal) => (
              <div key={meal.id} className="snap-start flex-shrink-0 w-[200px] md:w-[240px]">
                <MealCard meal={meal} />
              </div>
            ))
          ) : (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-[200px] aspect-[4/5] rounded-3xl bg-white/5 animate-pulse" />
            ))
          )}
        </div>
      </section>

      {/* Featured Meals */}
      <section>
        <SectionHeader 
          title="Featured Meals" 
        />
        <div className="flex gap-6 overflow-x-auto pb-8 -mx-6 px-6 scrollbar-hide snap-x">
          {!featMealsLoading ? (
            featuredMeals.map((meal) => (
              <div key={meal.id} className="snap-center flex-shrink-0 w-[220px] md:w-[260px]">
                <MealCard meal={meal} />
              </div>
            ))
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[220px] aspect-[4/5] rounded-3xl bg-white/5 animate-pulse" />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
