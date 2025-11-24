import axios, { AxiosError, type AxiosRequestConfig, type AxiosRequestHeaders } from 'axios';

/**
 * API Integration Layer for Foodie v2
 * Handles all communication with Django REST API backend
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000/api';

const initialToken =
  typeof window !== 'undefined' ? localStorage.getItem('token') : null;

// Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  status: number;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(initialToken ? { Authorization: `Token ${initialToken}` } : {}),
  },
});

export const apiClient = api;

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      if (!config.headers) {
        config.headers = { Authorization: `Token ${token}` } as AxiosRequestHeaders;
        return config;
      }

      if ('set' in config.headers && typeof config.headers.set === 'function') {
        (config.headers as AxiosRequestHeaders).set('Authorization', `Token ${token}`);
      } else {
        (config.headers as Record<string, string>).Authorization = `Token ${token}`;
      }
    }
  }

  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth state on 401
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
        // Redirect to auth page
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  console.info('[Foodie] API base URL:', API_BASE_URL);
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password2: string;
  full_name: string;
  role?: 'client' | 'chef';
  phone_number?: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: string;
  phone_number?: string;
  profile_image?: string;
  profile_picture?: string;
}

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
  badge?: string;
}

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
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Helper function to build headers
const buildHeaders = (includeAuth = false): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Token ${token}`;
    }
  }

  return headers;
};

const normalizeHeaders = (headers: AxiosRequestConfig['headers']): Record<string, string> => {
  if (!headers) {
    return {};
  }

  if (Array.isArray(headers)) {
    return headers.reduce<Record<string, string>>((acc, [key, value]) => {
      acc[String(key)] = String(value);
      return acc;
    }, {});
  }

  if (typeof headers === 'object') {
    return Object.entries(headers).reduce<Record<string, string>>((acc, [key, value]) => {
      if (Array.isArray(value)) {
        acc[key] = value.join(',');
      } else if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {});
  }

  return {};
};

// Generic API request handler
export async function apiRequest<T>(
  config: AxiosRequestConfig,
  requiresAuth = false
): Promise<ApiResponse<T>> {
  try {
    const headers = buildHeaders(requiresAuth);
    const mergedHeaders = {
      ...headers,
      ...normalizeHeaders(config.headers),
    };
    const response = await apiClient.request<T>({
      ...config,
      headers: mergedHeaders,
    });

    return {
      data: response.data as T,
      status: response.status,
    };
  } catch (error) {
    const err = error as AxiosError<
      | {
        detail?: string;
        error?: string;
        message?: string;
        [key: string]: unknown;
      }
      | string
    >;
    const status = err.response?.status ?? 0;
    const responseData = err.response?.data;

    let detail: string | undefined;
    let fieldErrors: Record<string, string[]> | undefined;

    if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
      const { detail: detailMessage, error: errorMessage, message: messageText, ...rest } =
        responseData as Record<string, unknown>;

      detail =
        (typeof detailMessage === 'string' ? detailMessage : undefined) ??
        (typeof errorMessage === 'string' ? errorMessage : undefined) ??
        (typeof messageText === 'string' ? messageText : undefined);

      const entries = Object.entries(rest);
      if (entries.length) {
        fieldErrors = {};
        entries.forEach(([key, value]) => {
          if (value === undefined || value === null) {
            return;
          }

          const messages = Array.isArray(value)
            ? value.map((item) => String(item))
            : [String(value)];

          fieldErrors![key] = messages;
        });

        if (!detail) {
          detail = Object.values(fieldErrors)
            .flat()
            .join(' ');
        }
      }
    } else if (typeof responseData === 'string') {
      detail = responseData;
    }

    const message =
      detail ||
      (typeof err === 'object' && err !== null ? err.message : undefined) ||
      'Network error occurred';
    console.error('[Foodie] API request failed:', message);

    return {
      error: message,
      errors: fieldErrors,
      status,
    };
  }
}

// Authentication APIs
export async function loginUser(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
  const response = await fetch(`${API_BASE_URL}/users/login/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({} as { detail?: string }));
    throw new Error(err.detail || `Login failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data?.token || !data?.user) {
    throw new Error('Login response missing token or user');
  }

  return data;
}

export async function registerUser(data: RegisterData): Promise<ApiResponse<{ token: string; user: User }>> {
  const [firstName = '', ...rest] = data.full_name.trim().split(/\s+/);
  const lastName = rest.join(' ');

  return apiRequest({
    url: '/users/register/',
    method: 'POST',
    data: {
      email: data.email,
      username: data.username,
      first_name: firstName || data.username,
      last_name: lastName,
      phone_number: data.phone_number ?? '',
      role: data.role ?? 'client',
      password: data.password,
      password_confirm: data.password2,
    },
  });
}

export async function getCurrentUser(): Promise<ApiResponse<User>> {
  return apiRequest({
    url: '/users/profile/',
    method: 'GET',
  }, true);
}

export async function logoutUser(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}

// Chef APIs
export async function getChefs(): Promise<ApiResponse<Chef[]>> {
  const response = await apiRequest<{ count: number; results: Chef[] }>({ url: '/chefs/' });

  // Django returns paginated response {count, results}, extract the results array
  if (response.data && 'results' in response.data) {
    return {
      data: response.data.results,
      status: response.status,
    };
  }

  // If it's already an array, return as is
  if (Array.isArray(response.data)) {
    return response as unknown as ApiResponse<Chef[]>;
  }

  // Otherwise return the error
  return response as unknown as ApiResponse<Chef[]>;
}

export async function getChefById(id: number): Promise<ApiResponse<Chef>> {
  return apiRequest({ url: `/chefs/${id}/` });
}

export async function toggleFavoriteChef(chefId: number): Promise<ApiResponse<{ status: string; is_favorited: boolean }>> {
  return apiRequest({
    url: `/chefs/${chefId}/favorite/`,
    method: 'POST',
  }, true);
}

export async function getFavoriteChefs(): Promise<ApiResponse<Chef[]>> {
  return apiRequest({
    url: '/chefs/favorites/',
    method: 'GET',
  }, true);
}

// Meal APIs
export async function getMeals(params?: { category?: string; search?: string }): Promise<ApiResponse<Meal[]>> {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  const endpoint = queryString ? `/meals/?${queryString}` : '/meals/';

  return apiRequest({ url: endpoint });
}

export async function getDiscoverFeed(params?: { search?: string; limit?: number }): Promise<ApiResponse<Meal[]>> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.limit) query.append('limit', String(params.limit));

  const endpoint = query.toString() ? `/meals/?${query.toString()}` : '/meals/';
  return apiRequest({ url: endpoint });
}

export async function getMealById(id: number): Promise<ApiResponse<Meal>> {
  return apiRequest({ url: `/meals/${id}/` });
}

// Order APIs
export async function createOrder(mealId: number, quantity: number = 1): Promise<ApiResponse<Order>> {
  return apiRequest({
    url: '/orders/',
    method: 'POST',
    data: { meal: mealId, quantity },
  }, true);
}

export async function getUserOrders(): Promise<ApiResponse<Order[]>> {
  return apiRequest({
    url: '/orders/user/',
    method: 'GET',
  }, true);
}

// Review APIs
export async function getReviews(mealId?: number): Promise<ApiResponse<Review[]>> {
  const endpoint = mealId ? `/reviews/?meal=${mealId}` : '/reviews/';
  return apiRequest({ url: endpoint });
}

export async function createReview(mealId: number, rating: number, comment: string): Promise<ApiResponse<Review>> {
  return apiRequest({
    url: '/reviews/',
    method: 'POST',
    data: { meal: mealId, rating, comment },
  }, true);
}

// Health Check API
export async function checkHealth(): Promise<ApiResponse<{ status: string }>> {
  return apiRequest({ url: '/' });
}

export interface ChefEvent {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  description?: string;
  is_all_day: boolean;
}

export async function getChefEvents(): Promise<ApiResponse<ChefEvent[]>> {
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
}

export async function createChefEvent(data: Omit<ChefEvent, 'id'>): Promise<ApiResponse<ChefEvent>> {
  return apiRequest({
    url: '/chefs/events/',
    method: 'POST',
    data,
  }, true);
}

export async function deleteChefEvent(id: number): Promise<ApiResponse<void>> {
  return apiRequest({
    url: `/chefs/events/${id}/`,
    method: 'DELETE',
  }, true);
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

export interface CreateMenuItemData {
  name: string;
  description: string;
  category: string;
  price_per_serving: number;
  delivery_available: boolean;
  pickup_available: boolean;
  image?: File;
}

export async function createMenuItem(data: CreateMenuItemData): Promise<ApiResponse<MenuItem>> {
  try {
    // Use FormData to send file to backend
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('price_per_serving', data.price_per_serving.toString());
    // Booleans need to be sent as "true"/"false" strings for Django to parse
    formData.append('delivery_available', data.delivery_available ? 'true' : 'false');
    formData.append('pickup_available', data.pickup_available ? 'true' : 'false');
    formData.append('preparation_time', '30');

    if (data.image) {
      formData.append('image', data.image);
    }

    const token = getAuthToken();
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/bookings/menu-items/create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage = 'Failed to create menu item';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.error || JSON.stringify(errorData);
      } catch {
        errorMessage = responseText || `Error ${response.status}`;
      }
      console.error('[Create Menu Item Error]', errorMessage);
      return {
        error: errorMessage,
        status: response.status,
      };
    }

    const result = await response.json();
    return {
      data: result,
      status: response.status,
    };
  } catch (error) {
    console.error('[Create Menu Item Error]', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to create menu item',
      status: 500,
    };
  }
}

// Get all menu items
export async function getMenuItems(): Promise<ApiResponse<MenuItem[]>> {
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
}

// Update menu item
export async function updateMenuItem(id: number, data: Partial<CreateMenuItemData>): Promise<ApiResponse<MenuItem>> {
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
}

// Delete menu item
export async function deleteMenuItem(id: number): Promise<ApiResponse<void>> {
  return apiRequest({
    url: `/bookings/menu-items/${id}/delete/`,
    method: 'DELETE',
  }, true);
}

// Get my chef profile
export async function getMyChefProfile(): Promise<ApiResponse<Chef>> {
  return apiRequest<Chef>({
    url: '/chefs/profile/me/',
    method: 'GET',
  }, true);
}

// Update chef profile
export async function updateChefProfile(data: FormData): Promise<ApiResponse<Chef>> {
  return apiRequest<Chef>({
    url: '/chefs/profile/me/',
    method: 'PATCH',
    data,
  }, true);
}

// Update client profile
export async function updateClientProfile(data: FormData): Promise<ApiResponse<User>> {
  return apiRequest<User>({
    url: '/users/profile/',
    method: 'PATCH',
    data,
  }, true);
}


// Chef Analytics API
export async function getChefAnalytics(): Promise<ApiResponse<{
  revenue: {
    total_revenue: number;
    month_revenue: number;
    week_revenue: number;
    daily_revenue: Array<{ date: string; revenue: number }>;
  };
  bookings: {
    total_bookings: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    month_bookings: number;
    upcoming_bookings: Array<{
      id: number;
      client_name: string;
      booking_date: string;
      service_type: string;
      number_of_guests: number;
      total_amount: number;
      status: string;
      confirmation_code: string;
    }>;
  };
  reviews: {
    average_rating: number;
    average_food_quality: number;
    average_professionalism: number;
    average_punctuality: number;
    total_reviews: number;
    rating_distribution: Record<string, number>;
    recent_reviews: Array<{
      id: number;
      client_name: string;
      rating: number;
      comment: string;
      created_at: string;
      food_quality: number;
      professionalism: number;
      punctuality: number;
    }>;
  };
  chef: {
    id: number;
    name: string;
    average_rating: number;
    total_bookings: number;
    is_verified: boolean;
  };
}>> {
  return apiRequest({
    url: '/chefs/analytics/',
    method: 'GET',
  }, true);
}

// Mock data for fallback (when API is unavailable)
export const mockChefs: Chef[] = [
  {
    id: 1,
    user: {
      id: 1,
      email: 'kamau@example.com',
      full_name: 'Chef Kamau',
      username: 'chefkamau'
    },
    specialties: ['Swahili Cuisine'],
    average_rating: 4.8,
    bio: 'Passionate about coastal flavors with 15 years of experience.',
    years_of_experience: 15,
  },
  {
    id: 2,
    user: {
      id: 2,
      email: 'aisha@example.com',
      full_name: 'Chef Aisha',
      username: 'chefaisha'
    },
    specialties: ['Contemporary African'],
    average_rating: 4.9,
    bio: 'Blending traditional recipes with modern techniques.',
    years_of_experience: 10,
  },
  {
    id: 3,
    user: {
      id: 3,
      email: 'omondi@example.com',
      full_name: 'Chef Omondi',
      username: 'chefomondi'
    },
    specialties: ['BBQ & Grills'],
    average_rating: 4.7,
    bio: 'Master of the grill, specializing in nyama choma.',
    years_of_experience: 12,
  },
];

export const mockMeals: Meal[] = [
  {
    id: 1,
    name: 'Ugali & Tilapia',
    price: 850,
    chef: 1,
    category: 'Traditional',
    rating: 4.7,
    description: 'Fresh tilapia served with ugali and sukuma wiki',
  },
  {
    id: 2,
    name: 'Pilau Rice',
    price: 650,
    chef: 1,
    category: 'Traditional',
    rating: 4.6,
    description: 'Aromatic spiced rice with tender beef',
  },
  {
    id: 3,
    name: 'Nyama Choma Platter',
    price: 1200,
    chef: 3,
    category: 'BBQ',
    rating: 4.9,
    description: 'Grilled goat meat with kachumbari and ugali',
  },
];
