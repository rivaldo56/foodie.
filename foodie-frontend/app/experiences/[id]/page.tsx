'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useExperienceDetails } from '@/hooks/useExperienceDetails';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Users, ChevronRight } from 'lucide-react';

export default function ExperienceDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { experience, menus, loading, error } = useExperienceDetails(id);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0c0a] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!experience) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0c0a] text-white space-y-4">
        <h1 className="text-2xl font-bold">Experience Not Found</h1>
        <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0c0a] text-white pb-20">
      <div className="relative h-[50vh] w-full">
        <Image
          src={experience.image_url || 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=1200&q=80'}
          alt={experience.name}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c0a] via-[#0f0c0a]/50 to-transparent" />

        <div className="absolute top-6 left-4 sm:left-8 z-10">
          <Link href="/" className="inline-flex items-center text-white/80 hover:text-white transition-colors bg-black/30 backdrop-blur rounded-full px-4 py-2 text-sm font-medium">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 sm:p-10 lg:p-16 max-w-7xl mx-auto">
          <div className="space-y-4 animate-in slide-in-from-bottom-5 fade-in duration-500">
            <span className="inline-block px-3 py-1 rounded-full bg-accent/90 text-white text-xs font-bold uppercase tracking-wider">
              {experience.category.replace('_', ' ')}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">{experience.name}</h1>
            <p className="text-lg sm:text-xl text-white/80 max-w-2xl leading-relaxed">{experience.description ?? ''}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-semibold mb-8 flex items-center gap-2">
          <span className="bg-accent/20 text-accent p-2 rounded-lg"><Users className="h-5 w-5" /></span>
          Choose Your Menu
        </h2>

        {menus.length === 0 ? (
          <div className="text-center py-12 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-white/60 text-lg">Currently unavailable.</p>
            <p className="text-sm text-white/40 mt-2">No active menus for this experience. Check back later.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {menus.map((menu) => (
              <div key={menu.id} className="group flex flex-col rounded-3xl border border-white/10 bg-white/5 overflow-hidden hover:border-accent/50 transition-all duration-300 hover:shadow-glow hover:-translate-y-1">
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={menu.image_url || experience.image_url || 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=800&q=80'}
                    alt={menu.name}
                    width={600}
                    height={400}
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
                    <div className="bg-black/60 backdrop-blur px-3 py-1.5 rounded-full text-white font-bold border border-white/10 text-sm">
                      Starting KES {(menu.base_price + (menu.price_per_person * menu.guest_min)).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold mb-2">{menu.name}</h3>
                  <p className="text-white/70 text-sm mb-6 line-clamp-3 flex-1">{menu.description ?? ''}</p>

                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {(menu.dietary_tags || []).map((tag) => (
                        <span key={tag} className="px-2 py-1 rounded-md bg-white/10 text-xs text-white/80">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-1 text-sm text-white/60 border-t border-white/10 pt-4 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {menu.guest_min} - {menu.guest_max} Guests</span>
                      </div>
                      <div className="flex justify-between text-xs opacity-80">
                        <span>Base Price: KES {menu.base_price.toLocaleString()}</span>
                        <span>+ KES {menu.price_per_person.toLocaleString()} / person</span>
                      </div>
                    </div>

                    <Link
                      href={`/experiences/${experience.id}/book?menuId=${menu.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black py-3.5 font-bold hover:bg-accent hover:text-white transition-colors"
                    >
                      Book This Menu <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
