'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, Flame, Heart, MapPin, Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import BottomDock from '@/components/BottomDock';

type FeedKind = 'meal' | 'chef';

type FeedItem = {
  id: string;
  kind: FeedKind;
  slug: string;
  title: string;
  subtitle: string;
  location: string;
  cuisine: string;
  match: number;
  price: number;
  highlight: string;
  image: string;
  rating: number;
  badge: string;
};

const SEED: Omit<FeedItem, 'id'>[] = [
  {
    kind: 'meal',
    slug: 'swahili-platter',
    title: 'Swahili Coastal Platter',
    subtitle: 'Chef Amina Hassan',
    location: 'Parklands',
    cuisine: 'Swahili Coast',
    match: 98,
    price: 48,
    highlight: 'Coconut-rich flavours layered with tamarind and chilli heat.',
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    badge: 'Signature',
  },
  {
    kind: 'meal',
    slug: 'aromatic-biryani',
    title: 'Aromatic Biryani & Coconut Curry',
    subtitle: 'Chef Fatuma Ahmed',
    location: 'Eastleigh',
    cuisine: 'Pilau & Biryani',
    match: 96,
    price: 38,
    highlight: 'Saffron rice, caramelised onions, and toasted cumin dust.',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    rating: 4.8,
    badge: 'Guest Favourite',
  },
  {
    kind: 'meal',
    slug: 'artisan-pasta',
    title: 'Handmade Pasta Creation',
    subtitle: 'Chef Sofia Rossi',
    location: 'Lavington',
    cuisine: 'Italian',
    match: 94,
    price: 65,
    highlight: 'Fresh pasta ribbons with roasted tomatoes and basil oil.',
    image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80',
    rating: 5,
    badge: 'Artisan',
  },
  {
    kind: 'meal',
    slug: 'ugali-stew',
    title: 'Ugali, Beef Stew & Sukuma',
    subtitle: 'Chef James Ochieng',
    location: 'Westlands',
    cuisine: 'Kenyan',
    match: 92,
    price: 28,
    highlight: 'Slow-braised beef with sukuma wiki and farm-fresh ugali.',
    image: 'https://images.unsplash.com/photo-1495195129352-aeb325a55b65?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    badge: 'Comfort Classic',
  },
  {
    kind: 'chef',
    slug: 'chef-ivy-wambui',
    title: 'Chef Ivy Wambui',
    subtitle: 'Plant-forward Experiences',
    location: 'Karen',
    cuisine: 'Seasonal Kenyan',
    match: 93,
    price: 120,
    highlight: 'Immersive tasting journeys around indigenous produce and grains.',
    image: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=900&q=80',
    rating: 4.9,
    badge: 'Top Rated',
  },
  {
    kind: 'chef',
    slug: 'chef-kenji-tanaka',
    title: 'Chef Kenji Tanaka',
    subtitle: 'Omakase + Izakaya',
    location: 'Kilimani',
    cuisine: 'Japanese',
    match: 96,
    price: 210,
    highlight: 'Seasonal omakase flights with sake pairings and smoke infusions.',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    rating: 5,
    badge: 'Hosted in 5★ Homes',
  },
];

const MAX_PAGES = 6;

function createBatch(page: number): FeedItem[] {
  return SEED.map((item, index) => ({
    ...item,
    id: `${item.slug}-${page}-${index}`,
    price: item.price + (page - 1) * 3 + index,
    match: Math.min(99, item.match - (page - 1) + (index % 3)),
    rating: Number((item.rating - (page % 2) * 0.05 + index * 0.03).toFixed(1)),
  }));
}

function FeedCard({ item, onCta }: { item: FeedItem; onCta: (item: FeedItem) => void }) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 text-white shadow-glow transition hover:border-accent/40">
      <div className="relative aspect-[4/3]">
        <Image
          src={item.image}
          alt={item.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0" />
        <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-surface">
          <Flame className="h-3 w-3" />
          {item.match}% Match
        </div>
        <button
          type="button"
          className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-surface transition hover:bg-white"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <p className="inline-flex items-center gap-2 text-xs text-accent">
            <Sparkles className="h-3.5 w-3.5" /> {item.badge}
          </p>
          <h3 className="text-lg font-semibold leading-tight line-clamp-2">{item.title}</h3>
          <p className="text-sm text-white/70">{item.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{item.cuisine}</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {item.location}
          </span>
          <span className="inline-flex items-center gap-1 text-amber-300">
            <Star className="h-3.5 w-3.5" />
            {(item.rating || 0).toFixed(1)}
          </span>
        </div>

        <p className="text-xs text-white/60 line-clamp-2">{item.highlight}</p>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <p className="font-semibold">${item.price}</p>
            <p className="text-xs text-white/50">per guest · 4 seats left</p>
          </div>
          <button
            type="button"
            onClick={() => onCta(item)}
            className="inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-strong"
          >
            {item.kind === 'chef' ? 'Book This Chef' : 'Book Chef'}
          </button>
        </div>
      </div>
    </article>
  );
}

function useInfiniteFeed(initial: FeedItem[]) {
  const [feed, setFeed] = useState(initial);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);

    setTimeout(() => {
      const nextPage = page + 1;
      setFeed((prev) => [...prev, ...createBatch(nextPage)]);
      setPage(nextPage);
      setHasMore(nextPage < MAX_PAGES);
      setLoading(false);
    }, 500);
  }, [hasMore, loading, page]);

  return { feed, hasMore, loading, loadMore };
}

export default function HomeFeedPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { feed, hasMore, loading, loadMore } = useInfiniteFeed(useMemo(() => createBatch(1), []));
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerSupported = typeof window !== 'undefined' && 'IntersectionObserver' in window;

  const handleCta = useCallback(
    (item: FeedItem) => {
      if (item.kind === 'chef') {
        router.push(`/chefs/${item.slug}`);
        return;
      }

      router.push(`/meals/${item.slug}`);
    },
    [router]
  );

  useEffect(() => {
    if (!observerSupported || !sentinelRef.current) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadMore();
      }
    }, { rootMargin: '200px' });

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, observerSupported]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#120b0b] via-[#1a1412] to-[#0b0908] text-white">
      <header className="sticky top-0 z-20 border-b border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <p className="text-xs uppercase tracking-[0.35em] text-accent/80">Welcome back</p>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">
            {user?.full_name ? `Hi, ${user.full_name}` : 'Hi, Foodie'} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-2 text-sm text-white/60">
            Discover personalised chef recommendations crafted just for you.
          </p>

          <label className="relative mt-6 block">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="search"
              placeholder="Search by cuisine, location, or chef name..."
              className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
              disabled
            />
          </label>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-40 pt-10 space-y-12">
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-white/80">
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold">AI-Powered Recommendations</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {feed.slice(0, 3).map((item) => (
              <FeedCard key={`featured-${item.id}`} item={item} onCta={handleCta} />
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Trending near you</h2>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/80">
              <Flame className="h-4 w-4 text-accent" /> Updated hourly
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {feed.map((item) => (
              <FeedCard key={item.id} item={item} onCta={handleCta} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={loadMore}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-6 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/20"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Loading more' : 'Load more experiences'}
              </button>
            </div>
          )}

          <div ref={sentinelRef} className="h-px w-full" aria-hidden />
        </section>
      </main>

      <BottomDock />
    </div>
  );
}
