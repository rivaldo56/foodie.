import { RecipeCategory } from '@/types/recipe';
import Link from 'next/link';
import { useRef } from 'react';

interface CategoryRailProps {
  categories: RecipeCategory[];
  activeSlug?: string;
}

export default function CategoryRail({ categories, activeSlug }: CategoryRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!categories.length) return null;

  return (
    <div className="w-full overflow-x-auto scrollbar-hide py-2" ref={scrollRef}>
      <div className="flex gap-3 px-4 min-w-max">
        {categories.map((cat) => {
           const isActive = activeSlug === cat.slug;
           return (
            <Link
                key={cat.id}
                href={`/discover?category=${cat.slug}`}
                className={`
                    flex items-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300
                    border
                    ${isActive 
                        ? 'bg-accent text-black border-accent' 
                        : 'bg-surface-elevated text-muted border-white/5 hover:border-white/20 hover:text-white'
                    }
                `}
            >
                <span className="text-xl">{cat.icon || '🍳'}</span>
                <span className="font-medium whitespace-nowrap">{cat.name}</span>
            </Link>
           );
        })}
      </div>
    </div>
  );
}
