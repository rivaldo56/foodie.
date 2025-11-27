import { apiClient, apiRequest, ApiResponse } from '../lib/api';

export interface Chef {
    id: number;
    user: {
        id: number;
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
}

export interface ChefReview {
    id: number;
    chef: number;
    chef_name: string;
    client: number;
    client_name: string;
    booking_id: number;
    rating: number;
    comment: string;
    food_quality?: number;
    professionalism?: number;
    punctuality?: number;
    created_at: string;
    updated_at: string;
}

export interface ChefEvent {
    id: number;
    title: string;
    start_time: string;
    end_time: string;
    description?: string;
    is_all_day: boolean;
}

export interface MenuItem {
    id: number;
    chef: number;
    chef_name?: string;
    name: string;
    description: string;
    category: string;
    price_per_serving: number;
    preparation_time?: number;
    image?: string;
    ingredients?: string[];
    delivery_available?: boolean;
    pickup_available?: boolean;
    is_available?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface CreateMenuItemData {
    name: string;
    description: string;
    category: string;
    price_per_serving: number;
    delivery_available: boolean;
    pickup_available: boolean;
    image?: File;
}

// Cloudinary upload function
export async function uploadToCloudinary(file: File, preset: string = 'menu_items'): Promise<string | null> {
    try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dxdkr0jby';

        console.log(`[Cloudinary] Uploading to cloud: ${cloudName}, preset: ${preset}`);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', preset);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Cloudinary] Upload failed with status:', response.status);
            console.error('[Cloudinary] Error response:', errorText);
            return null;
        }

        const data = await response.json();
        console.log('[Cloudinary] Upload successful:', data.secure_url);
        return data.secure_url || null;
    } catch (error) {
        console.error('[Cloudinary Upload Error]', error);
        return null;
    }
}

export const chefService = {
    async getChefs(): Promise<ApiResponse<Chef[]>> {
        const response = await apiRequest<{ count: number; results: Chef[] }>({ url: '/chefs/' });

        if (response.data && 'results' in response.data) {
            return {
                data: response.data.results,
                status: response.status,
            };
        }

        if (Array.isArray(response.data)) {
            return response as unknown as ApiResponse<Chef[]>;
        }

        return response as unknown as ApiResponse<Chef[]>;
    },

    async getChefById(id: number): Promise<ApiResponse<Chef>> {
        return apiRequest({ url: `/chefs/${id}/` });
    },

    async toggleFavorite(chefId: number): Promise<ApiResponse<{ status: string; is_favorited: boolean }>> {
        return apiRequest({
            url: `/chefs/${chefId}/favorite/`,
            method: 'POST',
        }, true);
    },

    async getFavorites(): Promise<ApiResponse<Chef[]>> {
        return apiRequest({
            url: '/chefs/favorites/',
            method: 'GET',
        }, true);
    },

    async getReviews(chefId: number): Promise<ApiResponse<ChefReview[]>> {
        const response = await apiRequest<{ count: number; results: ChefReview[] } | ChefReview[]>({
            url: `/chefs/${chefId}/reviews/`
        });

        if (response.data && !Array.isArray(response.data) && 'results' in response.data) {
            return {
                data: response.data.results,
                status: response.status,
            };
        }

        return response as unknown as ApiResponse<ChefReview[]>;
    },

    async getEvents(): Promise<ApiResponse<ChefEvent[]>> {
        const response = await apiRequest<{ count: number; results: ChefEvent[] } | ChefEvent[]>({
            url: '/chefs/events/',
            method: 'GET',
        }, true);

        if (response.data && !Array.isArray(response.data) && 'results' in response.data) {
            return {
                data: response.data.results,
                status: response.status,
            };
        }

        return response as unknown as ApiResponse<ChefEvent[]>;
    },

    async createEvent(data: Omit<ChefEvent, 'id'>): Promise<ApiResponse<ChefEvent>> {
        return apiRequest({
            url: '/chefs/events/',
            method: 'POST',
            data,
        }, true);
    },

    async deleteEvent(id: number): Promise<ApiResponse<void>> {
        return apiRequest({
            url: `/chefs/events/${id}/`,
            method: 'DELETE',
        }, true);
    },

    async getMyProfile(): Promise<ApiResponse<Chef>> {
        return apiRequest<Chef>({
            url: '/chefs/profile/me/',
            method: 'GET',
        }, true);
    },

    async updateProfile(data: FormData): Promise<ApiResponse<Chef>> {
        return apiRequest<Chef>({
            url: '/chefs/profile/me/',
            method: 'PATCH',
            data,
        }, true);
    },

    async getAnalytics(): Promise<ApiResponse<any>> {
        return apiRequest({
            url: '/chefs/analytics/',
            method: 'GET',
        }, true);
    },

    // Menu Items
    async createMenuItem(data: CreateMenuItemData): Promise<ApiResponse<MenuItem>> {
        try {
            const formData = new FormData();
            formData.append('name', data.name);
            if (data.description && data.description.trim()) {
                formData.append('description', data.description);
            }
            formData.append('category', data.category);
            formData.append('price_per_serving', data.price_per_serving.toString());
            formData.append('delivery_available', data.delivery_available ? 'true' : 'false');
            formData.append('pickup_available', data.pickup_available ? 'true' : 'false');
            formData.append('meal_prep_available', (data as any).meal_prep_available ? 'true' : 'false');
            formData.append('preparation_time', '30');

            if (data.image) {
                formData.append('image', data.image);
            }

            const response = await apiClient.post('/bookings/menu-items/create/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            return {
                data: response.data,
                status: response.status,
            };
        } catch (error) {
            console.error('[Create Menu Item Error]', error);
            const err = error as any;
            console.error('[Backend Response]', err.response?.data);
            console.error('[Status Code]', err.response?.status);

            // Extract detailed error message from Django validation errors
            let errorMsg = 'Failed to create menu item';

            if (err.response?.data) {
                const data = err.response.data;

                // Handle field validation errors (e.g., {description: ['error message']})
                if (typeof data === 'object' && !data.error && !data.detail) {
                    const fieldErrors = Object.entries(data)
                        .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                        .join('; ');
                    errorMsg = fieldErrors || errorMsg;
                } else {
                    errorMsg = data.error || data.detail || data.message || JSON.stringify(data);
                }
            } else if (err.message) {
                errorMsg = err.message;
            }

            return {
                error: errorMsg,
                status: err.response?.status || 500,
            };
        }
    },

    async getMenuItems(): Promise<ApiResponse<MenuItem[]>> {
        const response = await apiRequest<{ count: number; results: MenuItem[] } | MenuItem[]>({
            url: '/bookings/menu-items/',
            method: 'GET',
        });

        if (response.data && !Array.isArray(response.data) && 'results' in response.data) {
            return {
                data: response.data.results,
                status: response.status,
            };
        }

        return response as unknown as ApiResponse<MenuItem[]>;
    },

    async updateMenuItem(id: number, data: Partial<CreateMenuItemData>): Promise<ApiResponse<MenuItem>> {
        try {
            let imageUrl: string | null = null;
            if (data.image) {
                imageUrl = await uploadToCloudinary(data.image);
            }

            const payload: any = {};
            if (data.name) payload.name = data.name;
            if (data.description) payload.description = data.description;
            if (data.category) payload.category = data.category;
            if (data.price_per_serving) payload.price_per_serving = data.price_per_serving;
            if (data.delivery_available !== undefined) payload.delivery_available = data.delivery_available;
            if (data.pickup_available !== undefined) payload.pickup_available = data.pickup_available;
            if (imageUrl) payload.image = imageUrl;

            return apiRequest<MenuItem>({
                url: `/bookings/menu-items/${id}/update/`,
                method: 'PATCH',
                data: payload,
            }, true);
        } catch (error) {
            return {
                error: error instanceof Error ? error.message : 'Failed to update menu item',
                status: 500,
            };
        }
    },

    async deleteMenuItem(id: number): Promise<ApiResponse<void>> {
        return apiRequest({
            url: `/bookings/menu-items/${id}/delete/`,
            method: 'DELETE',
        }, true);
    }
};

export const {
    getChefs,
    getChefById,
    toggleFavorite,
    getFavorites,
    getReviews,
    getEvents,
    createEvent,
    deleteEvent,
    getMyProfile,
    updateProfile,
    getAnalytics,
    createMenuItem,
    getMenuItems,
    updateMenuItem,
    deleteMenuItem
} = chefService;
