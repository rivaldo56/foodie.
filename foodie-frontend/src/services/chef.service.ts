import { supabase } from '../lib/supabase';
import { ApiResponse } from '../lib/api';

export interface Chef {
    id: string | number;
    user_id?: string;
    user?: {
        id: string | number;
        email: string;
        full_name: string;
        phone: string;
    };
    bio: string;
    specialties: string[];
    experience_years: number;
    cuisine_types: string[];
    average_rating: number;
    total_bookings: number;
    total_reviews: number;
    is_verified: boolean;
    profile_picture: string | null;
    cover_photo: string | null;
    city?: string;
    state?: string;
    location?: string;
    hourly_rate?: number;
    badge?: 'new' | 'rising' | 'michelin';
    onboarding_data?: any;
    onboarding_step?: number;
}

export interface ChefReview {
    id: string | number;
    chef_id: string | number;
    chef_name: string;
    client_id: string;
    client_name: string;
    rating: number;
    comment: string;
    food_quality?: number;
    professionalism?: number;
    punctuality?: number;
    created_at: string;
}

export interface ChefEvent {
    id: string | number;
    chef_id: string;
    title: string;
    start_time: string;
    end_time: string;
    description?: string;
    is_all_day: boolean;
}

export interface MenuItem {
    id: string | number;
    chef_id: string;
    chef?: number;
    chef_name?: string;
    name: string;
    description: string;
    category: string;
    price_per_serving: number;
    image?: string;
    ingredients?: string[];
    is_available?: boolean;
    delivery_available?: boolean;
    pickup_available?: boolean;
    created_at?: string;
}

export const chefService = {
    async getChefs(): Promise<ApiResponse<Chef[]>> {
        const { data, error } = await supabase
            .from('chefs')
            .select('*')
            .eq('is_verified', true);

        if (error) return { error: error.message, status: 400 };
        return { data: data as Chef[], status: 200 };
    },

    async getChefById(id: string | number): Promise<ApiResponse<Chef>> {
        const { data, error } = await supabase
            .from('chefs')
            .select('*, user:users(*)')
            .eq('id', id)
            .single();

        if (error) return { error: error.message, status: 400 };
        return { data: data as Chef, status: 200 };
    },

    async getMyProfile(): Promise<ApiResponse<Chef>> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated', status: 401 };

        const { data, error } = await supabase
            .from('chefs')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') {
            return { error: error.message, status: 400 };
        }

        return { data: data as Chef, status: 200 };
    },

    async updateProfile(updates: Partial<Chef> | FormData): Promise<ApiResponse<Chef>> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated', status: 401 };

        let updateObj: Partial<Chef> = {};
        
        if (updates instanceof FormData) {
            updates.forEach((value, key) => {
                if (typeof value === 'string') {
                    // Try to parse arrays/json if needed, but bio and profile_picture are strings
                    (updateObj as any)[key] = value;
                }
            });
        } else {
            updateObj = updates;
        }

        const { data, error } = await supabase
            .from('chefs')
            .update(updateObj)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) return { error: error.message, status: 400 };
        return { data: data as Chef, status: 200 };
    },

    async completeOnboarding(onboardingData: any): Promise<ApiResponse<any>> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated', status: 401 };

        // 1. Create or update chef profile
        const { data, error } = await supabase
            .from('chefs')
            .upsert({
                user_id: user.id,
                bio: onboardingData.bio || '',
                cuisine_types: onboardingData.cuisineStrengths || [],
                experience_years: onboardingData.experienceYears || 0,
                location: onboardingData.location || '',
                onboarding_data: onboardingData,
                onboarding_step: 7, // Completed
                is_verified: false // Awaiting manual verification
            }, { 
                onConflict: 'user_id' 
            })
            .select()
            .single();

        if (error) return { error: error.message, status: 400 };

        // 2. Update user metadata role to chef if not already
        await supabase.auth.updateUser({
            data: { role: 'chef' }
        });

        return { data, status: 200 };
    },

    async getAnalytics(): Promise<ApiResponse<any>> {
        // This would typically be a complex query or an RPC
        return { 
            data: { 
                revenue: {
                    total_revenue: 0,
                    month_revenue: 0,
                    week_revenue: 0,
                    daily_revenue: []
                },
                bookings: {
                    total_bookings: 0,
                    pending: 0,
                    confirmed: 0,
                    completed: 0,
                    cancelled: 0,
                    month_bookings: 0,
                    upcoming_bookings: []
                },
                reviews: {
                    average_rating: 5,
                    average_food_quality: 5,
                    average_professionalism: 5,
                    average_punctuality: 5,
                    total_reviews: 0,
                    rating_distribution: {},
                    recent_reviews: []
                },
                chef: {
                    id: 0,
                    name: 'Guest Chef',
                    average_rating: 5,
                    total_bookings: 0,
                    is_verified: false
                }
            }, 
            status: 200 
        };
    },

    // Menu Items
    async getMenuItems(chefId?: string): Promise<ApiResponse<MenuItem[]>> {
        let query = supabase.from('menu_items').select('*');
        if (chefId) query = query.eq('chef_id', chefId);

        const { data, error } = await query;
        if (error) return { error: error.message, status: 400 };
        return { data: data as MenuItem[], status: 200 };
    },

    async createMenuItem(item: Omit<MenuItem, 'id' | 'chef_id'>): Promise<ApiResponse<MenuItem>> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated', status: 401 };

        const { data, error } = await supabase
            .from('menu_items')
            .insert({ ...item, chef_id: user.id })
            .select()
            .single();

        if (error) return { error: error.message, status: 400 };
        return { data: data as MenuItem, status: 201 };
    },

    // Legacy / Missing Stubs to fix build
    async getReviews(chefId?: string | number): Promise<ApiResponse<ChefReview[]>> {
        return { data: [], status: 200 };
    },

    async getEvents(chefId?: string | number): Promise<ApiResponse<ChefEvent[]>> {
        return { data: [], status: 200 };
    },

    async createEvent(event: any): Promise<ApiResponse<ChefEvent>> {
        return { data: {} as ChefEvent, status: 201 };
    },

    async uploadToCloudinary(file: File, folder?: string): Promise<string> {
        console.warn("Cloudinary upload stub called for folder:", folder, ". Returning placeholder.");
        return "https://via.placeholder.com/150";
    },

    async toggleFavorite(chefId: string | number): Promise<ApiResponse<any>> {
        return { data: { success: true }, status: 200 };
    }
};

export const {
    getChefs,
    getChefById,
    getMyProfile,
    updateProfile,
    completeOnboarding,
    getAnalytics,
    getMenuItems,
    createMenuItem,
    getReviews,
    getEvents,
    createEvent,
    uploadToCloudinary
} = chefService;

