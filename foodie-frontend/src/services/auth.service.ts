import { supabase } from '../lib/supabase';
import { ApiResponse } from '../lib/api';

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
    role?: 'client' | 'chef' | 'admin';
    phone_number?: string;
}

export interface User {
    id: string;
    email: string;
    username: string;
    full_name: string;
    role: 'client' | 'chef' | 'admin';
    phone_number?: string;
    profile_picture?: string;
}

// Helper to reliably extract user role
const getUserRole = (user: any): 'client' | 'chef' | 'admin' => {
    const appMetadata = user.app_metadata || {};
    const userMetadata = user.user_metadata || {};
    
    // Security: app_metadata.role (admin) always takes precedence
    if (appMetadata.role === 'admin') return 'admin';
    
    // Fallback to user_metadata for other roles, defaulting to client
    const role = userMetadata.role;
    return (role === 'chef' || role === 'client') ? role : 'client';
};

// Helper to map Supabase user to our User interface
const mapUser = (user: any): User => {
    const metadata = user.user_metadata || {};
    return {
        id: user.id,
        email: user.email || '',
        username: metadata.username || user.email?.split('@')[0] || 'user',
        full_name: metadata.full_name || 'Foodie User',
        role: getUserRole(user),
        phone_number: metadata.phone_number,
        profile_picture: metadata.profile_picture
    };
};

export const authService = {
    async login(credentials: LoginCredentials): Promise<{ token: string; user: User }> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
        });

        if (error) throw new Error(error.message);
        if (!data.session || !data.user) throw new Error('Login failed: No session returned');

        return {
            token: data.session.access_token,
            user: mapUser(data.user)
        };
    },

    async register(data: RegisterData): Promise<ApiResponse<{ token: string; user: User }>> {
        // Security: Prevent users from registering as admin directly
        const roleToRegister = data.role === 'admin' ? 'client' : (data.role || 'client');

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: {
                data: {
                    username: data.username,
                    full_name: data.full_name,
                    role: roleToRegister,
                    phone_number: data.phone_number ?? '',
                }
            }
        });

        if (authError) {
            return {
                error: authError.message,
                status: 400
            };
        }

        if (!authData.user) {
             // Should not happen for sign up, but handle safely
            return { error: 'Registration failed', status: 500 };
        }

        // Handle email confirmation case (session is null)
        if (!authData.session) {
            return {
                error: 'Registration successful. Please check your email for verification.',
                status: 201
            };
        }

        return {
            data: {
                token: authData.session.access_token,
                user: mapUser(authData.user)
            },
            status: 201
        };
    },

    async getCurrentUser(): Promise<ApiResponse<User>> {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return {
                error: error?.message || 'Not authenticated',
                status: 401
            };
        }

        return {
            data: mapUser(user),
            status: 200
        };
    },

    async logout(): Promise<void> {
        await supabase.auth.signOut();
        // Local storage clearing is now handled by onAuthStateChange in context
    },

    async updateProfile(formData: FormData): Promise<ApiResponse<User>> {
        const updates: any = {};
        formData.forEach((value, key) => {
             // Filter out empty strings if necessary or validate
            if (typeof value === 'string') updates[key] = value;
        });

        const { data: { user }, error } = await supabase.auth.updateUser({
            data: updates
        });

        if (error || !user) {
            return { error: error?.message || 'Update failed', status: 400 };
        }

        return {
            data: mapUser(user),
            status: 200
        };
    }
};

export const {
    login,
    register,
    getCurrentUser,
    logout,
    updateProfile
} = authService;

