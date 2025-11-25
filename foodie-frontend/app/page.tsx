'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Quote,
  Sparkles,
  UtensilsCrossed,
  Users,
  Clock,
  Star,
  Heart,
  Flame,
} from 'lucide-react';

const HOW_IT_WORKS = [
  {
    title: 'Choose Chef',
    description: 'Browse curated culinary artists across Nairobi and filter by cuisine, ratings, or availability.',
    icon: UtensilsCrossed,
  },
  {
    title: 'Pick Menu',
    description: 'Select personalised tasting menus or collaborate with your chef to design something bespoke.',
    icon: Sparkles,
  },
  {
    title: 'Enjoy',
    description: 'Relax as your chef arrives with everything needed to deliver a five-star experience at home.',
    icon: Clock,
  },
];

const DISCOVERY_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80',
    title: 'Truffled Mushroom Tagliatelle',
    subtitle: 'Chef Wanjiku Kamau • Italian Contemporary',
    trending: true,
  },
  {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    title: 'Citrus Glazed Salmon',
    subtitle: 'Chef David Mwangi • Coastal Fusion',
    trending: false,
  },
  {
    src: 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=900&q=80',
    title: 'Breakfast Royale',
    subtitle: 'Chef Aisha Gathoni • Brunch Atelier',
    trending: false,
  },
  {
    src: 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=900&q=80',
    title: 'Sushi Omakase',
    subtitle: 'Chef Kenji Tanaka • Omakase Sushi',
    trending: true,
  },
  {
    src: 'https://images.unsplash.com/photo-1464219789935-c2d9d9aba644?auto=format&fit=crop&w=900&q=80',
    title: 'Curry Goat Potjie',
    subtitle: 'Chef James Ochieng • Kenyan Heritage',
    trending: false,
  },
  {
    src: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=900&q=80',
    title: 'Pistachio Rose Éclairs',
    subtitle: 'Chef Zara Patel • Dessert Lab',
    trending: false,
  },
  {
    src: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80',
    title: 'Harissa Lobster Feast',
    subtitle: 'Chef Omar Hassan • Seafood Rituals',
    trending: true,
  },
  {
    src: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80',
    title: 'Burnt Basque Cheesecake',
    subtitle: 'Chef Carol Nduta • Pâtisserie',
    trending: false,
  },
  {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
    title: 'Nairobi Sunset Platter',
    subtitle: 'Chef Kevin Njoroge • Tapas Experience',
    trending: false,
  },
  {
    src: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80',
    title: 'Garden Herb Pasta',
    subtitle: 'Chef Ivy Wambui • Plant-forward',
    trending: false,
  },
];

const TESTIMONIALS = [
  {
    name: 'Michelle, Westlands',
    quote:
      'Foodie turned my anniversary dinner into an unforgettable tasting journey. The chef was warm, punctual, and insanely talented.',
    rating: 5,
  },
  {
    name: 'Kevin, Kilimani',
    quote: 'I booked Chef Aisha for a corporate dinner. The menu curation and execution were world-class—zero stress on my side.',
    rating: 5,
  },
  {
    name: 'Njeri, Karen',
    quote: 'From plating to flavours, every course felt like royal treatment. The concierge kept me updated at every step.',
    rating: 4.8,
  },
];

export default function LandingPage() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);

    return () => clearInterval(id);
  }, []);

  const testimonial = TESTIMONIALS[activeTestimonial];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0f0f] via-[#1b1814] to-[#0f0c0a] text-white">
      <main className="relative overflow-hidden">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,rgba(255,158,90,0.4),transparent_55%)]" aria-hidden />

        <section className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <div className="space-y-6 sm:space-y-8 lg:space-y-10">
              <div className="space-y-4 sm:space-y-6">
                <span className="inline-flex items-center gap-2 sm:gap-3 rounded-full bg-white/10 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.25em] sm:tracking-[0.35em] text-accent">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                  Foodie Experiences
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold leading-tight">
                  Book a Chef.<br className="hidden sm:block" /> Eat Like Royalty.
                </h1>
                <p className="text-sm sm:text-base lg:text-lg text-white/70 max-w-2xl">
                  Elevate intimate dinners, celebrations, and corporate gatherings with private chefs who bring Nairobi&rsquo;s vibrant culinary scene to your table.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white shadow-glow transition hover:bg-accent-strong active:scale-[0.98]"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-semibold text-white/80 backdrop-blur transition hover:border-white/40 active:scale-[0.98]"
                >
                  Sign In
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-white/70">
                <div className="space-y-1">
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white">120+</p>
                  <p className="leading-tight">Chefs onboarded</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white">4.9★</p>
                  <p className="leading-tight">Average event rating</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white">8K+</p>
                  <p className="leading-tight">Experiences hosted</p>
                </div>
              </div>
            </div>

            <div className="relative w-full">
              <div className="absolute -left-4 sm:-left-8 -top-4 sm:-top-8 h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-accent/40 blur-3xl" aria-hidden />
              <div className="absolute -right-3 sm:-right-6 bottom-0 h-20 w-20 sm:h-32 sm:w-32 rounded-full bg-emerald-500/30 blur-3xl" aria-hidden />
              <div className="relative rounded-2xl sm:rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-hero overflow-hidden">
                <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-1.5 sm:p-3 md:p-4 lg:p-6">
                  {[1, 2, 3, 4].map((item) => (
                    <div
                      key={item}
                      className="relative h-24 sm:h-32 md:h-40 lg:h-44 xl:h-48 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-white/10 to-white/5"
                    >
                      <Image
                        src={`/images/landing/hero-${item}.jpg`}
                        alt="Foodie showcase"
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 20vw"
                        priority
                        onError={(event) => {
                          (event.target as HTMLImageElement).style.opacity = '0';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 md:py-16">
          <div className="text-center space-y-2 sm:space-y-3">
            <p className="text-xs sm:text-sm uppercase tracking-[0.25em] sm:tracking-[0.35em] text-accent">Visual Food Discovery</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold px-4">Browse stunning dishes from our culinary collective</h2>
            <p className="text-xs sm:text-sm md:text-base text-white/70 max-w-2xl mx-auto px-4">
              Book in three taps: fall in love with flavours, choose your chef, and let the Foodie concierge handle the rest.
            </p>
          </div>

          <div className="mt-8 sm:mt-10 md:mt-12 space-y-3 sm:space-y-4 columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 sm:gap-4 [column-fill:_balance]"><div className="contents">
            {DISCOVERY_IMAGES.map(({ src, title, subtitle, trending }, index) => (
              <article
                key={`${title}-${index}`}
                className="group relative mb-3 sm:mb-4 break-inside-avoid rounded-2xl sm:rounded-3xl lg:rounded-4xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm shadow-glow transition hover:border-accent/40 hover:shadow-accent/20"
              >
                <div className="relative">
                  <Image
                    src={src}
                    alt={title}
                    width={500}
                    height={620}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 transition group-hover:opacity-100" />

                  <button
                    type="button"
                    className="absolute top-2 left-2 sm:top-3 sm:left-3 md:top-4 md:left-4 inline-flex h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-white/70 text-surface transition hover:bg-white"
                    aria-label="Save dish"
                  >
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                  </button>

                  {trending && (
                    <span className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 inline-flex items-center gap-1 rounded-full bg-accent px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold text-white shadow-glow">
                      <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      <span className="hidden sm:inline">Trending</span>
                    </span>
                  )}

                  <div className="absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3 md:inset-x-4 md:bottom-4 space-y-0.5 sm:space-y-1 text-left">
                    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-white leading-tight">{title}</h3>
                    <p className="text-[10px] sm:text-xs text-white/70">{subtitle}</p>
                  </div>
                </div>
              </article>
            ))}
          </div></div>

          <div className="mt-8 sm:mt-10 flex justify-center">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 active:scale-[0.98]"
            >
              Explore More Dishes
              <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </Link>
          </div>
        </section>
        <section className="relative z-10 bg-black/20 backdrop-blur border-y border-white/10">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14 md:py-16 space-y-8 sm:space-y-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-center sm:text-left">How Foodie Works</h2>
            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {HOW_IT_WORKS.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-2xl sm:rounded-3xl border border-white/5 bg-white/5 p-4 sm:p-5 md:p-6 shadow-lg backdrop-blur transition hover:border-accent/40 hover:bg-white/10"
                >
                  <span className="inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl sm:rounded-2xl bg-accent/15 text-accent">
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <h3 className="mt-4 sm:mt-5 md:mt-6 text-lg sm:text-xl font-semibold text-white">{title}</h3>
                  <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-white/70 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8 sm:gap-10 md:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6">
              <span className="inline-flex items-center gap-2 sm:gap-3 text-xs sm:text-sm uppercase tracking-[0.25em] sm:tracking-[0.3em] text-accent">
                <Star className="h-3 w-3 sm:h-4 sm:w-4" />
                Loved by hosts across Nairobi
              </span>
              <blockquote className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-5 sm:p-6 md:p-8 backdrop-blur">
                <Quote className="h-8 w-8 sm:h-10 sm:w-10 text-accent" />
                <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">"{testimonial.quote}"</p>
                <footer className="mt-4 sm:mt-6 text-xs sm:text-sm text-white/70 flex items-center gap-2">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-accent/30 flex items-center justify-center text-xs sm:text-sm font-semibold text-white">
                    {testimonial.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-xs text-white/60">Rated {testimonial.rating}★</p>
                  </div>
                </footer>
              </blockquote>

              <div className="flex gap-2">
                {TESTIMONIALS.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActiveTestimonial(index)}
                    className={`h-2 w-8 rounded-full transition ${index === activeTestimonial ? 'bg-accent' : 'bg-white/20'
                      }`}
                    aria-label={`Show testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] border border-white/10 bg-white/5 px-5 py-6 sm:px-6 sm:py-8 md:px-8 md:py-10 backdrop-blur">
              <h3 className="text-xl sm:text-2xl font-semibold text-white">Every detail, handled.</h3>
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-white/70 leading-relaxed">
                From mixologists to sommeliers, premium table settings to tailored playlists—we coordinate the experience so you can savour the moment.
              </p>

              <ul className="mt-6 sm:mt-8 space-y-3 sm:space-y-4 text-xs sm:text-sm text-white/80">
                <li className="flex items-start gap-2 sm:gap-3">
                  <Users className="mt-0.5 sm:mt-1 h-4 w-4 sm:h-5 sm:w-5 text-accent flex-shrink-0" />
                  Personalised guest experiences for 2 to 50 people.
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="mt-1 h-5 w-5 text-accent" />
                  Concierge support before, during, and after your booking.
                </li>
                <li className="flex items-start gap-3">
                  <UtensilsCrossed className="mt-1 h-5 w-5 text-accent" />
                  Menus tailored to dietary preferences and cultural inspirations.
                </li>
              </ul>

              <div className="mt-6 sm:mt-8 md:mt-10">
                <Link
                  href="/home"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 active:scale-[0.98]"
                >
                  Explore Marketplace
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
