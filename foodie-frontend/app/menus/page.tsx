'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useExploreMenus } from '@/hooks/useExploreMenus';
import { MenuCard, SectionHeader } from '@/components/discovery/DiscoveryComponents';
import { Loader2, ArrowLeft } from 'lucide-react';

function MenusLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-video rounded-3xl bg-white/5 animate-pulse border border-white/10" />
      ))}
    </div>
  );
}

function MenusList() {
  const { menus, loading } = useExploreMenus(50);

  if (loading) return <MenusLoading />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {menus.map((menu) => (
        <MenuCard key={menu.id} menu={menu} />
      ))}
    </div>
  );
}

export default function MenusPage() {
  return (
    <div className="min-h-screen bg-[#0f0c0a] text-white pt-24 pb-20 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="space-y-4">
          <Link href="/client/home" className="inline-flex items-center text-white/60 hover:text-white transition-colors mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
              All Menus
            </h1>
            <p className="text-white/40 text-lg font-medium max-w-2xl">
              From intimate tasting journeys to vibrant family feasts.
            </p>
          </div>
        </header>

        <section>
          <Suspense fallback={<MenusLoading />}>
            <MenusList />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
