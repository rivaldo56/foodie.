import { recipeService } from '@/services/recipe.service';
import RecipeDetails from '@/components/recipes/RecipeDetails';

// Disable caching for time-based content or use revalidate
export const revalidate = 60; // Revalidate every minute

export default async function RecipePage({ params }: { params: { slug: string } }) {
  // In Next.js 13+, params is an object, but inside async component we can use it.
  // Ideally, we should handle error states (try/catch)
  let recipe = null;
  try {
      recipe = await recipeService.getRecipe(params.slug);
  } catch (e) {
      // Logic to show 404 or error
      return <div className="min-h-screen flex items-center justify-center text-white">Recipe not found</div>;
  }

  return <RecipeDetails recipe={recipe} />;
}
