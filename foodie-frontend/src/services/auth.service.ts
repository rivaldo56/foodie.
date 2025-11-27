import { apiClient, apiRequest, ApiResponse } from '../lib/api';

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

export const authService = {
    async login(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
        try {
            const response = await apiClient.post('/users/login/', {
                email: credentials.email,
                password: credentials.password,
            });

            const data = response.data;

            if (!data?.token || !data?.user) {
                throw new Error('Login response missing token or user');
            }

            return data;
        } catch (error: any) {
            // Extract meaningful error message from backend response
            const errorMessage = error.response?.data?.non_field_errors?.[0]
                || error.response?.data?.email?.[0]
                || error.response?.data?.password?.[0]
                || error.response?.data?.detail
                || error.message
                || 'Invalid email or password';

            throw new Error(errorMessage);
        }
    },

    async register(data: RegisterData): Promise<ApiResponse<{ token: string; user: User }>> {
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
    },

    async getCurrentUser(): Promise<ApiResponse<User>> {
        return apiRequest({
            url: '/users/profile/',
            method: 'GET',
        }, true);
    },

    async logout(): Promise<void> {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
        }
    },

    async updateProfile(data: FormData): Promise<ApiResponse<User>> {
        return apiRequest<User>({
            url: '/users/profile/',
            method: 'PATCH',
            data,
        }, true);
    }
};

export const {
    login,
    register,
    getCurrentUser,
    logout,
    updateProfile
} = authService;
