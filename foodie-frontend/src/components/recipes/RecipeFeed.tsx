"use client";

import { useEffect, useState } from 'react';
import { RecipeFeedResponse, RecipeCategory } from '@/types/recipe';
import { recipeService } from '@/services/recipe.service';
import RecipeCard from './RecipeCard';
import CategoryRail from './CategoryRail';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface RecipeFeedProps {
  hideHeader?: boolean;
}

export default function RecipeFeed({ hideHeader = false }: RecipeFeedProps) {
  const [feed, setFeed] = useState<RecipeFeedResponse | null>(null);
  const [categories, setCategories] = useState<RecipeCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [feedData, catData] = await Promise.all([
          recipeService.getFeed(),
          recipeService.getCategories()
        ]);
        setFeed(feedData);
        setCategories(catData);
      } catch (error) {
        console.error("Failed to load recipe feed", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted animate-pulse">Thinking of delicious things...</div>;
  }

  if (!feed) return null;

  return (
    <div className="space-y-12 pb-24">
      {/* Dynamic Header */}
      {!hideHeader && (
        <header className="px-4 pt-6 pb-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {feed.greeting}, <span className="text-accent">Rivaldo</span>
          </h1>
          <p className="text-muted-strong flex items-center gap-2">
            <Sparkles size={16} className="text-yellow-400" />
            Ready to discover your next meal?
          </p>
        </header>
      )}

      {/* Category Rail */}
      <section>
        <CategoryRail categories={categories} />
      </section>

      {/* Feed Sections */}
      {feed.sections.map((section, idx) => (
        <section key={idx} className="space-y-4">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-bold text-white">{section.title}</h2>
            <Link 
                href={`/discover?category=${section.category_slug}`}
                className="text-sm text-accent hover:text-white transition-colors flex items-center gap-1"
            >
                See All <ArrowRight size={14} />
            </Link>
          </div>

          {/* Horizontal Scroll for Carousel */}
          {section.type === 'carousel' || section.type === 'category_row' ? (
             <div className="overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4">
               <div className="flex gap-4 min-w-max px-4">
                 {section.recipes.map((recipe) => (
                   <div key={recipe.id} className="w-[280px]">
                     <RecipeCard recipe={recipe} />
                   </div>
                 ))}
               </div>
             </div>
          ) : (
            // Grid Layout
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
                {section.recipes.map((recipe) => (
                   <RecipeCard key={recipe.id} recipe={recipe} />
                 ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
