'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { 
  Loader2, 
  ArrowLeft, 
  Users, 
  CreditCard, 
  ShieldCheck, 
  Info, 
  Star,
  Flame,
  Clock,
  MapPin,
  UtensilsCrossed
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import BottomDock from '@/components/BottomDock';
import { mealService } from '@/services/meal.service';

export default function MenuDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [menu, setMenu] = useState<any>(null);
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [menuRes, mealsRes] = await Promise.all([
          supabase
            .from('menus')
            .select('*, experience:experiences(*)')
            .eq('id', id)
            .single(),
          mealService.getMenuMeals(id)
        ]);

        if (menuRes.error) throw menuRes.error;
        setMenu(menuRes.data);
        setMeals(mealsRes.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (id) fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0c0a] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !menu) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0c0a] text-white space-y-4">
        <h1 className="text-2xl font-bold">Menu Not Found</h1>
        <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  const startingPrice = menu.base_price + (menu.price_per_person * menu.guest_min);
  const starter = meals.find(m => m.course_type === 'starter')?.meal;
  const main = meals.find(m => m.course_type === 'main')?.meal;
  const dessert = meals.find(m => m.course_type === 'dessert')?.meal;

  return (
    <div className="min-h-screen bg-[#0f0c0a] text-white pb-32">
      <div className="relative h-[40vh] w-full">
        <Image
          src={menu.image_url || menu.experience?.image_url || 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=1200&q=80'}
          alt={menu.name}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c0a] via-[#0f0c0a]/40 to-transparent" />
        
        <div className="absolute top-6 left-4 sm:left-8 z-10">
          <button 
            onClick={() => router.back()} 
            className="inline-flex items-center text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur rounded-full px-4 py-2 text-sm font-medium"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </button>
        </div>

        <div className="absolute bottom-6 left-0 w-full px-6 sm:px-10 max-w-7xl mx-auto">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-accent/90 text-white text-[10px] font-bold uppercase tracking-wider">
              {menu.experience?.category?.replace('_', ' ') || 'Menu'}
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold">{menu.name}</h1>
            <p className="text-white/60 text-sm max-w-2xl">{menu.experience?.name}</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold border-b border-white/10 pb-4">Menu Description</h2>
            <p className="text-white/70 leading-relaxed text-lg italic">
              "{menu.description || 'Experience a unique culinary journey crafted by our expert chefs.'}"
            </p>
          </section>

          {(starter || main || dessert) && (
            <section className="space-y-8">
              <h2 className="text-xl font-semibold border-b border-white/10 pb-4">What You'll Enjoy</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Starter', meal: starter },
                  { label: 'Main', meal: main },
                  { label: 'Dessert', meal: dessert }
                ].filter(item => item.meal).map(({ label, meal }) => (
                  <div key={label} className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 aspect-[3/4] transition-all hover:scale-[1.02] hover:border-accent/30 shadow-2xl">
                    <Image 
                      src={meal.image_url || 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=400&q=80'} 
                      alt={meal.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      unoptimized
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80" />
                    <div className="absolute top-4 left-4">
                      <span className="bg-accent/90 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md">
                        {label}
                      </span>
                    </div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h4 className="text-white font-bold text-lg mb-1 drop-shadow-lg leading-tight">
                        {meal.name}
                      </h4>
                      {meal.kcal && (
                        <p className="text-white/60 text-xs font-medium">{meal.kcal} kcal</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-6">
            <h2 className="text-xl font-semibold border-b border-white/10 pb-4">Standard Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="bg-accent/20 p-3 rounded-xl">
                  <Flame className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Chef Prepared</h3>
                  <p className="text-sm text-white/50 whitespace-nowrap">Professional on-site preparation</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="bg-accent/20 p-3 rounded-xl">
                  <Clock className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Flexible Timing</h3>
                  <p className="text-sm text-white/50 whitespace-nowrap">Coordinated to your schedule</p>
                </div>
              </div>
            </div>
          </section>

          {menu.dietary_tags?.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold border-b border-white/10 pb-4">Dietary Tags</h2>
              <div className="flex flex-wrap gap-3">
                {menu.dietary_tags.map((tag: string) => (
                  <span key={tag} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className="sticky top-24 rounded-3xl border border-white/10 bg-white/5 p-8 space-y-8 backdrop-blur-xl">
            <div className="space-y-6">
              <div className="flex justify-between items-end">
                <span className="text-sm text-white/50 uppercase tracking-widest font-medium">Price Structure</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Base Booking Fee</span>
                  <span className="font-semibold">KES {menu.base_price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Per Person Rate</span>
                  <span className="font-semibold">KES {menu.price_per_person.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-4 border-t border-white/5">
                  <span className="text-white/60">Minimum Guests</span>
                  <span className="font-semibold">{menu.guest_min}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-lg font-bold">Starting from</span>
                  <span className="text-2xl font-bold text-accent">KES {startingPrice.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-white/30 text-right">Includes base fee + min guests</p>
              </div>
              
              {menu.total_kcal > 0 && (
                <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                  <span className="text-sm text-white/50">Estimated Total Nutrition</span>
                  <span className="text-sm font-semibold text-accent">{menu.total_kcal} kcal</span>
                </div>
              )}
            </div>

            <Link 
              href={`/book/${menu.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-white shadow-glow transition hover:bg-accent-strong transform active:scale-95"
            >
              <CreditCard className="h-4 w-4" />
              Book This Menu
            </Link>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 text-xs text-white/40">
                <ShieldCheck className="h-4 w-4 text-accent" />
                <span>Verified Chef assignment</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-white/40">
                <Clock className="h-4 w-4 text-accent" />
                <span>Instant booking available</span>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <BottomDock />
    </div>
  );
}
