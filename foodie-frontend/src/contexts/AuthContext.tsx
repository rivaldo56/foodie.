'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { authService, User, LoginCredentials, RegisterData, mapUser } from '@/services/auth.service';
import { useToast } from '@/contexts/ToastContext';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterData) => Promise<{
    success: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
  }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const TOKEN_COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const setTokenCookie = (value: string | null) => {
  if (typeof document === 'undefined') return;

  if (!value) {
    document.cookie = `${TOKEN_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }

  document.cookie = `${TOKEN_COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { showToast } = useToast();

  // Initialize auth state and listen for changes
  useEffect(() => {
    let mounted = true;

    // 1. Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (mounted) {
          if (session?.user) {
            setToken(session.access_token);
            // Optimistically map user from session to avoid redundant network call
            const mappedUser = mapUser(session.user);
            setUser(mappedUser);
            
            // Sync cookie
            setTokenCookie(session.access_token);
          } else {
            setToken(null);
            setUser(null);
            setTokenCookie(null);
          }
          setLoading(false);
        }
      } catch (error) {
        // Log but don't crash; session might just be missing
        console.warn('[Foodie] Auth initialization notice:', error instanceof Error ? error.message : error);
        if (mounted) {
          setLoading(false);
          setUser(null);
          setToken(null);
        }
      }
    };

    initializeAuth();

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Foodie] Auth event:', event);
      
      if (!mounted) return;

      try {
        if (session?.user) {
          setToken(session.access_token);
          setTokenCookie(session.access_token); // Sync cookie
          
          // Use session user directly to avoid race conditions with navigation
          const mappedUser = mapUser(session.user);
          setUser(mappedUser);
          
          if (event === 'SIGNED_IN') {
             console.log('[Foodie] User signed in:', mappedUser.email);
          }
        } else {
          setToken(null);
          setTokenCookie(null); // Clear cookie
          setUser(null);
        }
        setLoading(false);
      } catch (error) {
        console.error('[Foodie] Auth state change error:', error);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const { user: newUser } = await authService.login(credentials);
      
      // State updates handled by onAuthStateChange, but we can optimistically set for speed
      // or just wait for the event. Waiting is safer for consistency.
      
      console.log('[Foodie] Login success');
      showToast('Welcome back!', 'success');

      // Handle Redirects based on role
      startTransition(() => {
        if (newUser.role === 'admin') {
          router.push('/admin');
        } else if (newUser.role === 'chef') {
          router.push('/chef/dashboard');
        } else {
          router.push('/client/home');
        }
      });

      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Network error';
      console.error('[Foodie] Login failed:', message);
      showToast(message || 'Login failed', 'error');
      return { success: false, error: message };
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data);

      if (response.data) {
        const { user: newUser } = response.data;
        
        showToast('Account created! Karibu.', 'success');
        
        // Handle Redirects
        startTransition(() => {
          if (newUser.role === 'chef') {
            router.replace('/chef/onboarding');
          } else {
            router.replace('/client/home');
          }
        });
        return { success: true };
      }

      if (response.error) {
        // If it's the email verification case
        if (response.status === 201) {
             showToast(response.error, 'success');
             return { success: true };
        }

        console.error('[Foodie] Registration API error:', response.error);
        showToast(response.error, 'error');
      }

      return {
        success: false,
        error: response.error || 'Registration failed',
        fieldErrors: response.errors, // Assuming ApiResponse might have this from backend, mostly simpler now
      };
    } catch (error) {
      console.error('[Foodie] Registration request failed:', error);
      const message = error instanceof Error ? error.message : 'Network error';
      showToast(message || 'Registration failed', 'error');
      return { success: false, error: message };
    }
  };

  const logout = () => {
    authService.logout();
    // State clearing handled by onAuthStateChange
    startTransition(() => {
      router.replace('/auth');
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
