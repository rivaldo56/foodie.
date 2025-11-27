import { apiRequest, ApiResponse } from '../lib/api';
import { MenuItem } from './chef.service';
import { User } from './auth.service';
import { Chef } from './chef.service';

export interface Meal {
    id: number;
    name: string;
    price: number | string;
    chef?: number;
    chef_name?: string;
    category: string;
    rating?: number;
    image?: string;
    description?: string;
    location?: string;
}

export interface Order {
    id: number;
    meal: number;
    user: number;
    status: string;
    created_at: string;
    total_amount?: number;
    total?: number;
    scheduled_at?: string;
    guest_count?: number;
    special_requests?: string;
}

export interface Review {
    id: number;
    meal: number;
    user: string;
    rating: number;
    comment: string;
    created_at: string;
}

export interface Booking {
    id: number;
    client: User;
    chef: Chef;
    service_type: string;
    booking_date: string;
    duration_hours: number;
    number_of_guests: number;
    service_address: string;
    service_city: string;
    service_state: string;
    service_zip_code: string;
    special_requests?: string;
    dietary_requirements?: string[];
    status: string;
    base_price: number;
    additional_fees: number;
    total_amount: number;
    confirmation_code?: string;
    created_at?: string;
    updated_at?: string;
    confirmed_at?: string;
    completed_at?: string;
    cancelled_at?: string;
    is_priority?: boolean;
    down_payment_amount?: number;
    payment_status?: string;
}

export interface CreateBookingPayload {
    chefId: number;
    eventDate: string;
    eventTime: string;
    guestCount: number;
    durationHours?: number;
    serviceAddress: string;
    serviceCity: string;
    serviceState: string;
    serviceZipCode: string;
    serviceType?: string;
    specialRequests?: string;
    dietaryRequirements?: string[];
    menuItems?: Array<{ menu_item_id: number; quantity: number; special_instructions?: string }>;
    isPriority?: boolean;
    downPaymentAmount?: number;
}

function toApiPayload(payload: CreateBookingPayload) {
    // Combine date and time into ISO datetime string
    const bookingDate = new Date(`${payload.eventDate}T${payload.eventTime}`).toISOString();

    return {
        chef_id: payload.chefId,
        booking_date: bookingDate,
        number_of_guests: payload.guestCount,
        duration_hours: payload.durationHours || 2,
        service_type: payload.serviceType || 'personal_meal',
        service_address: payload.serviceAddress,
        service_city: payload.serviceCity,
        service_state: payload.serviceState,
        service_zip_code: payload.serviceZipCode,
        special_requests: payload.specialRequests || '',
        dietary_requirements: payload.dietaryRequirements || [],
        menu_items: payload.menuItems || [],
        is_priority: payload.isPriority || false,
        down_payment_amount: payload.downPaymentAmount || 0,
    };
}

export const bookingService = {
    async getMeals(params?: { category?: string; search?: string }): Promise<ApiResponse<Meal[]>> {
        const queryParams = new URLSearchParams();
        if (params?.category) queryParams.append('category', params.category);
        if (params?.search) queryParams.append('search', params.search);

        const queryString = queryParams.toString();
        const endpoint = queryString ? `/meals/?${queryString}` : '/meals/';

        return apiRequest({ url: endpoint });
    },

    async getDiscoverFeed(params?: { search?: string; limit?: number }): Promise<ApiResponse<Meal[]>> {
        const query = new URLSearchParams();
        if (params?.search) query.append('search', params.search);
        if (params?.limit) query.append('limit', String(params.limit));

        const endpoint = query.toString() ? `/meals/?${query.toString()}` : '/meals/';
        return apiRequest({ url: endpoint });
    },

    async getMealById(id: number): Promise<ApiResponse<Meal>> {
        return apiRequest({ url: `/meals/${id}/` });
    },

    async getChefMeals(chefId: number): Promise<ApiResponse<Meal[]>> {
        const response = await apiRequest<{ count: number; results: MenuItem[] } | MenuItem[]>({
            url: `/bookings/chef/${chefId}/menu-items/`
        });

        let items: MenuItem[] = [];

        if (response.data) {
            if (Array.isArray(response.data)) {
                items = response.data;
            } else if ('results' in response.data) {
                items = response.data.results;
            }
        }

        const meals: Meal[] = items.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price_per_serving,
            chef: item.chef,
            chef_name: item.chef_name,
            category: item.category,
            image: item.image,
            description: item.description,
            rating: 4.8, // Mock rating for now
            location: 'Nairobi', // Default location
        }));

        return {
            data: meals,
            status: response.status,
            error: response.error,
        };
    },

    async createOrder(mealId: number, quantity: number = 1): Promise<ApiResponse<Order>> {
        return apiRequest({
            url: '/orders/',
            method: 'POST',
            data: { meal: mealId, quantity },
        }, true);
    },

    async getUserOrders(): Promise<ApiResponse<Order[]>> {
        return apiRequest({
            url: '/orders/user/',
            method: 'GET',
        }, true);
    },

    async getReviews(mealId?: number): Promise<ApiResponse<Review[]>> {
        const endpoint = mealId ? `/reviews/?meal=${mealId}` : '/reviews/';
        return apiRequest({ url: endpoint });
    },

    async createReview(mealId: number, rating: number, comment: string): Promise<ApiResponse<Review>> {
        return apiRequest({
            url: '/reviews/',
            method: 'POST',
            data: { meal: mealId, rating, comment },
        }, true);
    },

    async createBooking(payload: CreateBookingPayload): Promise<Booking> {
        const response = await apiRequest<Booking>({
            url: '/bookings/create/',
            method: 'POST',
            data: toApiPayload(payload),
        }, true);

        if (response.error) {
            throw new Error(response.error);
        }

        if (!response.data) {
            throw new Error('No booking data returned from server');
        }

        return response.data;
    },

    async getBookings(): Promise<ApiResponse<Booking[]>> {
        return apiRequest<Booking[]>({
            url: '/bookings/',
            method: 'GET',
        }, true);
    },

    async cancelBooking(id: number): Promise<ApiResponse<any>> {
        return apiRequest({
            url: `/bookings/${id}/cancel/`,
            method: 'POST',
        }, true);
    },

    async updateBookingStatus(id: number, status: string): Promise<ApiResponse<any>> {
        return apiRequest({
            url: `/bookings/${id}/status/`,
            method: 'PATCH',
            data: { status }
        }, true);
    }
};

export const {
    getMeals,
    getDiscoverFeed,
    getMealById,
    getChefMeals,
    createOrder,
    getUserOrders,
    getReviews,
    createReview,
    createBooking,
    getBookings,
    cancelBooking,
    updateBookingStatus
} = bookingService;
