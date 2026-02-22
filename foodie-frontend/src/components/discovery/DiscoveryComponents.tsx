'use client';

import Image from 'next/image';
import Link from 'next/link';
import { 
  Heart, 
  Flame, 
  ShieldCheck, 
  Users, 
  ChevronRight
} from 'lucide-react';

export function SectionHeader({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="flex items-end justify-between mb-6 px-1">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-white/50">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="text-sm font-medium text-accent hover:text-accent-strong flex items-center gap-1 transition-colors">
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

export function ExperienceCard({ experience }: { experience: any }) {
  return (
    <Link 
      href={`/experiences/${experience.id}`}
      className="group relative flex flex-col gap-3"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition-all duration-300 group-hover:border-accent/40 group-hover:shadow-glow-sm">
        <Image
          src={experience.image_url || 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=900&q=80'}
          alt={experience.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        <button 
          className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/80 hover:text-accent transition-colors"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
        >
          <Heart className="h-4 w-4" />
        </button>

        {experience.is_featured && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
            <Flame className="h-3 w-3 fill-white" />
            Featured
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 text-left">
          <h3 className="text-lg font-bold text-white line-clamp-1">{experience.name}</h3>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/60 font-medium">
            <span>For 2+ guests</span>
            <span className="h-0.5 w-0.5 rounded-full bg-white/30" />
            <span>From KES {experience.startingPrice?.toLocaleString() || '---'}/person</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function MenuCard({ menu, premium = false }: { menu: any; premium?: boolean }) {
  const targetHref = premium ? `/book?menu_id=${menu.id}` : `/menus/${menu.id}`;
  
  return (
    <Link 
      href={targetHref}
      className={`group relative flex flex-col gap-4 ${premium ? 'flex-shrink-0 w-[300px]' : ''}`}
    >
      <div className={`relative ${premium ? 'aspect-[4/5]' : 'aspect-video'} overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition-all duration-300 group-hover:border-accent/40 group-hover:shadow-glow-sm`}>
        <Image
          src={menu.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80'}
          alt={menu.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80" />
        
        {menu.featured && (
          <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" />
            Instant Book
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 text-left space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {menu.dietary_tags?.slice(0, 2).map((tag: string) => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-[10px] text-white/80 border border-white/5">
                {tag}
              </span>
            ))}
          </div>
          <h3 className="text-lg font-bold text-white line-clamp-2 leading-tight">{menu.name}</h3>
          <div className="flex items-center gap-3 text-white/60 text-[10px] font-medium">
            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {menu.guest_min}-{menu.guest_max} guests</span>
            <span className="h-0.5 w-0.5 rounded-full bg-white/30" />
            <span>KES {menu.price_per_person?.toLocaleString()}/person</span>
          </div>
        </div>
      </div>
      {premium && (
        <div className="flex gap-3">
          <span className="flex-1 inline-flex items-center justify-center rounded-2xl bg-accent py-4 text-sm font-bold text-white transition hover:bg-accent-strong shadow-glow-sm">
            Book Now
          </span>
        </div>
      )}
    </Link>
  );
}
export function MealCard({ meal }: { meal: any }) {
  return (
    <div className="group relative flex flex-col gap-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition-all duration-300 group-hover:border-accent/40 group-hover:shadow-glow-sm">
        <Image
          src={meal.image_url || 'https://images.unsplash.com/photo-1546069901-eacef0df6022?auto=format&fit=crop&w=900&q=80'}
          alt={meal.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
        
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider border border-white/10">
          {meal.category}
        </div>

        {meal.total_bookings > 5 && (
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full bg-accent/90 text-white text-[10px] font-bold uppercase tracking-wider">
            <Flame className="h-3 w-3 fill-white" />
            Popular
          </div>
        )}

        <div className="absolute bottom-4 left-4 right-4 text-left">
          <h3 className="text-lg font-bold text-white line-clamp-1">{meal.name}</h3>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/60 font-medium">
            <span>{meal.kcal || '---'} kcal</span>
            <span className="h-0.5 w-0.5 rounded-full bg-white/30" />
            <span>{meal.total_bookings || 0} bookings</span>
          </div>
        </div>
      </div>
    </div>
  );
}
