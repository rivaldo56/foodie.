import Link from 'next/link';
import Image from 'next/image';
import { Meal } from '@/services/booking.service';
import { stableScore } from '@/lib/utils';
import { Flame, MapPin, Star, Clock, Utensils } from 'lucide-react';

interface MealCardProps {
  meal: Meal;
  matchScore?: number;
  chefName?: string;
  location?: string;
  highlight?: string;
  hidePrice?: boolean;
  hideChef?: boolean;
  onClick?: () => void;
  customHref?: string;
}

export default function MealCard({
  meal,
  matchScore,
  chefName,
  location,
  highlight,
  hidePrice = false,
  hideChef = false,
  onClick,
  customHref
}: MealCardProps) {
  const match = matchScore ?? stableScore(`meal-${meal.id}`, 92, 97);
  const chefDisplay = chefName || `Chef ${meal.chef}`;
  const locationDisplay = location || 'Nairobi';
  const highlightText = highlight || "Curated flavour pairing you'll love";

  const CardContent = (
    <article className="rounded-3xl gradient-border hover-glow transition-all duration-300 h-full">
      <div className="bg-surface-elevated rounded-[23px] overflow-hidden soft-border h-full flex flex-col">
        <div className="relative h-52 flex-shrink-0">
          {meal.image ? (
            <Image
              src={meal.image}
              alt={meal.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full bg-gray-200 flex items-center justify-center text-gray-400">
              <Utensils className="h-12 w-12" />
            </div>
          )}

          <div className="absolute top-4 left-4 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white shadow-glow">
            ~ {match}% Match
          </div>
          <button
            className="absolute top-4 right-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-surface/80 text-muted hover:text-accent transition"
            aria-label="Save meal"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Add save logic here if needed
            }}
          >
            <Flame className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 flex flex-col flex-grow">
          <header className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white leading-tight line-clamp-2">
                {meal.name}
              </h3>
              <span className="badge-soft px-3 py-1 rounded-full text-xs whitespace-nowrap">
                {meal.category}
              </span>
            </div>
            <p className="text-sm text-muted-strong flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
                <Star className="h-4 w-4" fill="#fbbf24" />
                {meal.rating != null ? Number(meal.rating).toFixed(1) : 'N/A'}
              </span>
              {!hideChef && (
                <>
                  <span className="h-1 w-1 rounded-full bg-muted/40" aria-hidden />
                  {chefDisplay}
                </>
              )}
            </p>
          </header>

          {meal.description && (
            <p className="text-sm text-muted line-clamp-2 flex-grow">
              {meal.description}
            </p>
          )}

          <div className="flex items-center justify-between text-sm text-muted-strong pt-2 mt-auto">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4 text-accent" />
              {locationDisplay}
            </span>
            {!hidePrice && (
              <span className="text-lg font-semibold text-accent">
                KSh {meal.price.toLocaleString()}
              </span>
            )}
          </div>

          <p className="text-xs text-muted line-clamp-1 pt-2 border-t border-white/5">
            {highlightText}
          </p>
        </div>
      </div>
    </article>
  );

  if (onClick) {
    return (
      <div onClick={onClick} className="group block cursor-pointer h-full">
        {CardContent}
      </div>
    );
  }

  return (
    <Link href={customHref || `/menus/${meal.id}`} className="group block h-full">
      {CardContent}
    </Link>
  );
}
