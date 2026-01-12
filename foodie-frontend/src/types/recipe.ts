export interface RecipeCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description: string;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'any';
  mood_tags: string[];
}

export interface Recipe {
  id: number;
  title: string;
  slug: string;
  description: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  image_url: string;
  category?: RecipeCategory;
  likes_count: number;
  calories?: number;
  servings?: number;
  chef_name?: string;
  chef_image?: string;
}

export interface RecipeFeedSection {
  type: 'category_row' | 'carousel' | 'grid';
  title: string;
  category_slug: string;
  recipes: Recipe[];
}

export interface RecipeFeedResponse {
  greeting: string;
  time_context: string;
  sections: RecipeFeedSection[];
}
