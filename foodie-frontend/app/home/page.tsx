'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Sparkles, 
  Flame, 
  Heart, 
  MapPin, 
  Star, 
  Search, 
  Users, 
  CreditCard,
  ArrowRight,
  ChevronRight,
  Clock,
  UtensilsCrossed,
  ShieldCheck
} from 'lucide-react';
import { usePublishedExperiences } from '@/hooks/usePublishedExperiences';
import { useFeaturedExperiences } from '@/hooks/useFeaturedExperiences';
import { useExploreMenus } from '@/hooks/useExploreMenus';
import { useFeaturedMenus } from '@/hooks/useFeaturedMenus';
import BottomDock from '@/components/BottomDock';

import { SectionHeader, ExperienceCard, MenuCard } from '@/components/discovery/DiscoveryComponents';

function HomeLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
    </div>
  );
}

export default function HomeFeedPage() {
  const { experiences, loading: expLoading } = usePublishedExperiences();
  const { experiences: featuredExp, loading: featExpLoading } = useFeaturedExperiences();
  const { menus, loading: menusLoading } = useExploreMenus(10);
  const { menus: featuredMenus, loading: featMenusLoading } = useFeaturedMenus(4);

  return (
    <div className="relative min-h-screen bg-[#0f0c0a] text-white pb-32 pt-12">
      {/* Brand Header */}
      <div className="mx-auto max-w-6xl px-6 mb-12">
        <Link href="/" className="inline-block">
          <div className="relative w-24 h-8">
            <Image 
              src="/foodie_logo.png" 
              alt="Foodie Logo" 
              fill 
              className="object-contain"
            />
          </div>
        </Link>
      </div>

      <header className="relative z-10 mx-auto max-w-6xl px-6 mb-16">
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            What are you<br />planning today?
          </h1>
          <p className="text-white/40 text-lg font-medium max-w-md">
            Private chefs for dinners, events & meal prep
          </p>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 space-y-20">
        
        {/* Explore Experiences */}
        <section>
          <SectionHeader 
            title="Explore experiences" 
            href="/experiences"
          />
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
              href="/discover"
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

        {/* Explore Menus - Horizontal Scroll */}
        <section>
          <SectionHeader 
            title="Explore Menus" 
            href="/discover"
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

        {/* Featured Menus - High Emphasis */}
        <section className="pb-12">
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

      </main>

      <BottomDock />
    </div>
  );
}
