import { apiRequest, ApiResponse } from '../lib/api';
import { Recipe, RecipeFeedResponse, RecipeCategory } from '@/types/recipe';

class RecipeService {
    async getFeed(): Promise<RecipeFeedResponse> {
        const response = await apiRequest<RecipeFeedResponse>({ url: '/recipes/feed/' });
        if (response.error) throw new Error(response.error);
        return response.data as RecipeFeedResponse;
    }

    async getCategories(): Promise<RecipeCategory[]> {
        const response = await apiRequest<RecipeCategory[]>({ url: '/recipes/categories/' });
        if (response.error) throw new Error(response.error);
        return response.data as RecipeCategory[];
    }

    async getRecipes(params?: { category?: string; search?: string }): Promise<Recipe[]> {
        const response = await apiRequest<Recipe[]>({ 
            url: '/recipes/list/',
            params 
        });
        if (response.error) throw new Error(response.error);
        return response.data as Recipe[];
    }

    async getRecipe(slug: string): Promise<Recipe> {
        const response = await apiRequest<Recipe>({ url: `/recipes/recipes/${slug}/` });
        if (response.error) throw new Error(response.error);
        return response.data as Recipe;
    }
}

export const recipeService = new RecipeService();
