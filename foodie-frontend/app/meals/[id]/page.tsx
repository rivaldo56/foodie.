
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getMealById, getReviews, createOrder, Meal, Review, mockMeals } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import ReviewCard from '@/components/ReviewCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomDock from '@/components/BottomDock';
import ChatAssistantFab from '@/components/ChatAssistantFab';
import { Flame, MapPin, Timer, Users, Star, Sparkles } from 'lucide-react';

export default function MealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const mealId = parseInt(params.id as string);
  
  const [meal, setMeal] = useState<Meal | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const highlightBadges = useMemo(() => {
    return [
      { icon: <Flame className="h-4 w-4 text-accent" />, label: 'Chef curated spice balance' },
      { icon: <Timer className="h-4 w-4 text-accent" />, label: 'Ready in ~45 mins' },
      { icon: <Users className="h-4 w-4 text-accent" />, label: 'Ideal for 4-6 guests' },
    ];
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      const mealResponse = await getMealById(mealId);
      if (mealResponse.data) {
        setMeal(mealResponse.data);
      } else {
        const mockMeal = mockMeals.find(m => m.id === mealId);
        if (mockMeal) setMeal(mockMeal);
      }

      const reviewsResponse = await getReviews(mealId);
      if (reviewsResponse.data) {
        setReviews(reviewsResponse.data);
      }

      setLoading(false);
    };

    fetchData();
  }, [mealId]);

  const handleOrder = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setOrdering(true);
    setOrderError(null);
    
    const response = await createOrder(mealId);
    
    if (response.data) {
      setOrderSuccess(true);
      setTimeout(() => {
        router.push('/orders');
      }, 2000);
    } else {
      setOrderError(response.error || 'Failed to create order');
    }
    
    setOrdering(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!meal) {
    return (
      <EmptyState title="Meal not found" description="Jaribu tena baadaye au chagua chakula kingine." />
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 py-10">
        <header className="space-y-4">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-accent uppercase tracking-[0.35em]">
            <Sparkles className="h-4 w-4" />
            Chefs Signature Dish
          </p>
          <h1 className="text-4xl font-semibold text-white max-w-3xl">{meal.name}</h1>
          <p className="text-sm text-muted max-w-2xl">
            {meal.description || 'Experience a chef-crafted meal featuring seasonal ingredients and authentic techniques tailored for your table.'}
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[3fr,2fr]">
          <div className="rounded-3xl bg-surface-elevated soft-border shadow-glow overflow-hidden">
            <div className="relative h-[420px]">
              {meal.image ? (
                <Image
                  src={meal.image}
                  alt={meal.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl">🍽️</div>
              )}
              <span className="absolute top-6 left-6 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white shadow-glow">
                {meal.category}
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-strong">
                <span className="inline-flex items-center gap-2 text-white font-semibold text-base">
                  <Star className="h-4 w-4 text-amber-300" fill="#fbbf24" />
                  {meal.rating != null ? `${meal.rating.toFixed(1)} • ${reviews.length} reviews` : `${reviews.length} reviews`}
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  Nairobi, Kenya
                </span>
              </div>

              <div className="grid gap-2 md:grid-cols-3">
                {highlightBadges.map((badge, index) => (
                  <span key={index} className="inline-flex items-center gap-2 rounded-2xl bg-surface-highlight px-4 py-2 text-xs text-muted">
                    {badge.icon}
                    {badge.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl bg-surface-elevated soft-border shadow-glow p-6 space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted uppercase tracking-[0.35em]">Investment</p>
                <p className="text-3xl font-semibold text-accent">KSh {meal.price.toLocaleString()}</p>
              </div>

              {orderSuccess && (
                <div className="rounded-2xl bg-success/15 px-4 py-3 text-sm text-success">
                  Oda imefanikiwa! Tunakupeleka kwenye ukurasa wa mipango...
                </div>
              )}

              {orderError && (
                <div className="rounded-2xl bg-danger/15 px-4 py-3 text-sm text-danger">
                  {orderError}
                </div>
              )}

              <button
                onClick={handleOrder}
                disabled={ordering || orderSuccess}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-muted/40"
              >
                {ordering ? 'Inaandaliwa...' : orderSuccess ? 'Imewekwa!' : 'Weka nafasi sasa'}
              </button>

              <Link
                href={`/meals/${meal.id}/review`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-surface-highlight px-6 py-3 text-sm font-semibold text-muted hover:text-white"
              >
                Andika maoni yako
              </Link>
            </div>

            <div className="rounded-3xl bg-surface-elevated soft-border shadow-glow p-6 space-y-4 text-sm text-muted">
              <h2 className="text-sm font-semibold text-muted uppercase tracking-[0.35em]">Special notes</h2>
              <p>
                Tunashirikiana na mpishi kuandaa menyu binafsi. Unaweza kusasisha maelekezo maalum, vikwazo vya chakula, au mtiririko wa kozi mara baada ya kuweka oda.
              </p>
              <p className="text-xs text-muted-strong">Kupata msaada wa haraka, tumia msaidizi wa Kiswahili upande wa kulia.</p>
            </div>
          </aside>
        </section>

        <section className="rounded-3xl bg-surface-elevated soft-border shadow-glow p-6 space-y-6">
          <header className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold text-white">Maoni ya wateja</h2>
            <p className="text-sm text-muted">Tunapenda kusikia kutoka kwako. Shiriki uzoefu wako baada ya hafla.</p>
          </header>

          {reviews.length === 0 ? (
            <p className="rounded-2xl bg-surface-highlight px-6 py-8 text-center text-sm text-muted">
              Hakuna reviews bado. Kuwa wa kwanza kushiriki safari yako ya kipekee!
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
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

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="rounded-full bg-surface-highlight p-6 text-4xl">🍽️</div>
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      <p className="text-sm text-muted max-w-sm">{description}</p>
      <Link
        href="/meals"
        className="mt-4 inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-glow"
      >
        Rudi kwenye menyu
      </Link>
    </div>
  );
}
