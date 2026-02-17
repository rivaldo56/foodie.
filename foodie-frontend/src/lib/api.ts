import axios, { AxiosError, type AxiosRequestConfig, type AxiosRequestHeaders } from 'axios';

/**
 * API Integration Layer for Foodie v2
 * Handles all communication with Django REST API backend
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  '';

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
  city?: string;
  state?: string;
  location?: string;
  hourly_rate?: number;
  badge?: 'new' | 'rising' | 'michelin';
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
// Moved to services/auth.service.ts

// Chef APIs
// Moved to services/chef.service.ts

// Meal APIs
// Moved to services/booking.service.ts

// Order APIs
// Moved to services/booking.service.ts

// Review APIs
// Moved to services/booking.service.ts

// Health Check API
export async function checkHealth(): Promise<ApiResponse<{ status: string }>> {
  return apiRequest({ url: '/' });
}

// Chef Event APIs
// Moved to services/chef.service.ts

// Cloudinary upload function
// Moved to services/chef.service.ts

// Menu Item APIs
// Moved to services/chef.service.ts

// Chef Profile APIs
// Moved to services/chef.service.ts

// Chef Analytics API
// Moved to services/chef.service.ts

// Stub exports for legacy pages (chefs, discover, meals) until wired to Supabase
export const mockChefs: Chef[] = [];
export const mockMeals: Meal[] = [];



