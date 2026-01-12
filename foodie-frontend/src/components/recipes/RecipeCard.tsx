import Link from 'next/link';
import Image from 'next/image';
import { Recipe } from '@/types/recipe';
import { Clock, Flame, PlayCircle } from 'lucide-react';

interface RecipeCardProps {
  recipe: Recipe;
  priority?: boolean;
}

export default function RecipeCard({ recipe, priority = false }: RecipeCardProps) {
  // Format times nicely
  const timeDisplay = recipe.total_time_minutes 
    ? `${recipe.total_time_minutes} min`
    : `${recipe.prep_time_minutes} min`;

  return (
    <Link 
      href={`/recipes/${recipe.slug}`}
      className="group relative block w-full aspect-[4/5] rounded-[32px] overflow-hidden bg-surface-elevated soft-border hover-glow transition-all duration-500"
    >
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={recipe.image_url}
          alt={recipe.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="absolute inset-0 z-10 p-5 flex flex-col justify-end">
        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex gap-2">
          {recipe.category && (
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium border border-white/10">
              {recipe.category.icon} {recipe.category.name}
            </span>
          )}
        </div>

        {/* Video Indicator */}
        {recipe.video_url && (
            <div className="absolute top-4 right-4">
                 <div className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                    <PlayCircle size={16} fill="currentColor" className="text-white opacity-90" />
                 </div>
            </div>
        )}

        {/* Text Details */}
        <div className="space-y-2 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
          <h3 className="text-xl font-bold text-white leading-tight line-clamp-2">
            {recipe.title}
          </h3>
          
          <div className="flex items-center gap-4 text-white/80 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-accent" />
              {timeDisplay}
            </span>
            <span className="flex items-center gap-1.5">
               <Flame size={14} className={recipe.difficulty === 'easy' ? 'text-green-400' : recipe.difficulty === 'medium' ? 'text-yellow-400' : 'text-red-400'} />
              {recipe.difficulty}
            </span>
             {recipe.likes_count > 0 && (
                <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                    ♥ {recipe.likes_count}
                </span>
             )}
          </div>
        </div>
      </div>
    </Link>
  );
}
