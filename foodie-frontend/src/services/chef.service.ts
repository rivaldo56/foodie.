import { supabase } from '../lib/supabase';
import { ApiResponse } from '../lib/api';

export interface Chef {
    id: string;
    user_id?: string;
    user?: {
        id: string;
        email: string;
        full_name: string;
        phone: string;
    };
    name: string;
    bio: string;
    specialties: string[];
    experience_level: 'beginner' | 'intermediate' | 'experienced' | 'expert';
    experience_years?: number;
    cuisine_types?: string[];
    average_rating?: number;
    total_bookings?: number;
    total_reviews?: number;
    verified: boolean; // Legacy V3 field
    is_verified?: boolean; // New Paystack payment system field
    is_active?: boolean; // New Paystack payment system field
    paystack_subaccount_code?: string;
    paystack_recipient_code?: string;
    onboarding_status: 'pending_verification' | 'approved' | 'suspended';
    profile_picture: string | null;
    cover_photo?: string | null;
    city?: string;
    state?: string;
    address?: string;
    zip_code?: string;
    hourly_rate?: number;
    per_guest_rate?: number;
    base_booking_fee?: number;
    service_radius?: number;
    travel_radius_km?: number;
    badge?: 'new' | 'rising' | 'michelin';
    onboarding_data?: any;
    onboarding_step?: number;
    created_at?: string;
    updated_at?: string;
}

export interface ChefReview {
    id: string;
    chef_id: string;
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
    id: string;
    chef_id: string;
    title: string;
    start_time: string;
    end_time: string;
    description?: string;
    is_all_day: boolean;
}

export interface MenuItem {
    id: string;
    chef_id: string;
    chef?: number | string;
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
            .eq('verified', true);

        if (error) return { error: error.message, status: 400 };
        return { data: data as Chef[], status: 200 };
    },

    async getAllChefsAdmin(): Promise<ApiResponse<Chef[]>> {
        const { data, error } = await supabase
            .from('chefs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) return { error: error.message, status: 400 };
        return { data: data as Chef[], status: 200 };
    },

    async getChefById(id: string): Promise<ApiResponse<Chef>> {
        const { data, error } = await supabase
            .from('chefs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) return { error: error.message, status: 400 };
        return { data: data as Chef, status: 200 };
    },

    async updateChefAdmin(id: string, updates: Partial<Chef>): Promise<ApiResponse<Chef>> {
        const { data, error } = await supabase
            .from('chefs')
            .update(updates)
            .eq('id', id)
            .select()
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

        // 1. Initial profile upsert to register core chef details
        const { data: chef, error: upsertErr } = await supabase
            .from('chefs')
            .upsert({
                user_id: user.id,
                name: onboardingData.fullName || user.user_metadata?.full_name || 'Chef',
                bio: onboardingData.bio || '',
                cuisine_specialties: onboardingData.cuisineStrengths || [],
                specialties: onboardingData.cuisineStrengths || [],
                experience_years: onboardingData.yearsOfExperience || 0,
                onboarding_data: onboardingData,
                onboarding_step: 7,
                verified: false
            }, { 
                onConflict: 'user_id' 
            })
            .select()
            .single();

        if (upsertErr) return { error: upsertErr.message, status: 400 };

        // 2. Invoke chef-onboarding Edge Function to handle Paystack subaccount creation
        // This function will update the chef record with paystack codes and set verified status
        try {
            const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('chef-onboarding', {
                body: {
                    chef_id: chef.id,
                    name: chef.name,
                    phone: onboardingData.phone || user.user_metadata?.phone || '',
                    // Bank details could be added here if collected in UI
                }
            });

            if (edgeErr) {
                console.warn("[Onboarding] Paystack setup error:", edgeErr);
                // We don't throw here to allow the chef to still access the dashboard,
                // but we might want to flag it to the user.
            }
        } catch (err) {
            console.error("[Onboarding] Edge function invocation failed:", err);
        }

        // 3. Update auth metadata role
        await supabase.auth.updateUser({
            data: { role: 'chef' }
        });

        return { data: chef, status: 200 };
    },

    async getAnalytics(): Promise<ApiResponse<any>> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated', status: 401 };

        // 1. Get Chef Profile
        const { data: chef, error: chefErr } = await supabase
            .from('chefs')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (chefErr) return { error: 'Chef profile not found', status: 404 };

        // 2. Get Bookings with Menu and Client details
        const { data: bookings, error: bookingsErr } = await supabase
            .from('bookings')
            .select(`
                id, status, total_price, date_time, guests_count, experience_type,
                address, city, state, zip_code, sla_expires_at,
                menu:menus(name),
                client:profiles(id, full_name, email, avatar_url)
            `)
            .eq('chef_id', chef.id);

        if (bookingsErr) return { error: bookingsErr.message, status: 400 };

        // 3. Process Bookings for Analytics
        const total_bookings = bookings.length;
        const pending = bookings.filter(b => ['rotating', 'assigned', 'pending'].includes(b.status)).length;
        const confirmed = bookings.filter(b => b.status === 'confirmed').length;
        const completed = bookings.filter(b => b.status === 'completed').length;
        const cancelled = bookings.filter(b => b.status === 'canceled').length;

        const total_revenue = bookings
            .filter(b => ['confirmed', 'completed'].includes(b.status))
            .reduce((sum, b) => sum + Number(b.total_price || 0), 0);

        // Upcoming bookings list for the dashboard
        const upcoming_bookings = bookings
            .filter(b => ['rotating', 'assigned', 'confirmed'].includes(b.status))
            .map(b => ({
                id: b.id,
                client_name: (b as any).client?.full_name || 'Client',
                client: (b as any).client, // Pass full client object
                booking_date: b.date_time,
                service_type: b.experience_type || (Array.isArray(b.menu) ? b.menu[0]?.name : (b.menu as any)?.name) || 'Private Dining',
                number_of_guests: b.guests_count,
                total_amount: b.total_price,
                status: b.status,
                confirmation_code: b.id.slice(0, 8).toUpperCase(),
                service_address: b.address,
                service_city: b.city,
                service_state: b.state,
                service_zip_code: b.zip_code,
                sla_expires_at: b.sla_expires_at
            }))
            .sort((a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime());

        // 4. Get Reviews
        const { data: reviews } = await supabase
            .from('chef_reviews')
            .select('*')
            .eq('chef_id', chef.id)
            .order('created_at', { ascending: false });

        const avgRating = reviews && reviews.length > 0 
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
            : 5;

        return { 
            data: { 
                revenue: { 
                    total_revenue, 
                    month_revenue: total_revenue, // Simplified
                    week_revenue: total_revenue, // Simplified
                    daily_revenue: [] 
                },
                bookings: { 
                    total_bookings, 
                    pending, 
                    confirmed, 
                    completed, 
                    cancelled, 
                    month_bookings: upcoming_bookings.length, 
                    upcoming_bookings 
                },
                reviews: { 
                    average_rating: avgRating, 
                    average_food_quality: avgRating, 
                    average_professionalism: avgRating, 
                    average_punctuality: avgRating, 
                    total_reviews: reviews?.length || 0, 
                    rating_distribution: {}, 
                    recent_reviews: reviews || [] 
                },
                chef: { 
                    id: chef.id, 
                    name: chef.name || 'Chef', 
                    average_rating: avgRating, 
                    total_bookings: total_bookings, 
                    verified: chef.verified 
                }
            }, 
            status: 200 
        };
    },

    async getMenuItems(chefId?: string): Promise<ApiResponse<MenuItem[]>> {
        // ... (existing code handles this) ...
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

    async getReviews(chefId?: string): Promise<ApiResponse<ChefReview[]>> {
        const { data, error } = await supabase
            .from('chef_reviews')
            .select('*')
            .eq('chef_id', chefId)
            .order('created_at', { ascending: false });

        if (error) return { error: error.message, status: 400 };
        return { data: data as ChefReview[], status: 200 };
    },

    async getEvents(chefId?: string): Promise<ApiResponse<ChefEvent[]>> {
        const { data, error } = await supabase
            .from('chef_events')
            .select('*')
            .eq('chef_id', chefId);

        if (error) return { error: error.message, status: 400 };
        return { data: data as ChefEvent[], status: 200 };
    },

    async createEvent(event: Omit<ChefEvent, 'id' | 'chef_id'>): Promise<ApiResponse<ChefEvent>> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: 'Not authenticated', status: 401 };

        const { data: chef } = await supabase
            .from('chefs')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!chef) return { error: 'Chef profile not found', status: 404 };

        const { data, error } = await supabase
            .from('chef_events')
            .insert({ ...event, chef_id: chef.id })
            .select()
            .single();

        if (error) return { error: error.message, status: 400 };
        return { data: data as ChefEvent, status: 201 };
    },

    async uploadToCloudinary(file: File, folder?: string): Promise<string> {
        return "https://via.placeholder.com/150";
    },

    async toggleFavorite(chefId: string): Promise<ApiResponse<any>> {
        return { data: { success: true }, status: 200 };
    }
};

export const {
    getChefs,
    getAllChefsAdmin,
    getChefById,
    updateChefAdmin,
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

