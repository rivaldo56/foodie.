'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { startTransition } from 'react';
import { authService, User, LoginCredentials, RegisterData } from '@/services/auth.service';
import { useToast } from '@/contexts/ToastContext';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const clearAuthState = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setTokenCookie(null);
    setToken(null);
    setUser(null);
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      if (typeof window === 'undefined') return;

      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setTokenCookie(storedToken);
      } else {
        setLoading(false);
        setTokenCookie(null);
      }

      setHydrated(true);
    };

    loadUser();
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await authService.getCurrentUser();

        if (cancelled) return;

        if (response.data) {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
          return;
        }

        if (response.status === 401) {
          console.warn('[Foodie] Auth token invalid, clearing session');
          clearAuthState();
          return;
        }

        if (response.error) {
          console.error('[Foodie] Failed to refresh profile:', response.error);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[Foodie] Unexpected error fetching profile:', error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [token, hydrated]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const { token: newToken, user: newUser } = await authService.login(credentials);

      setToken(newToken);
      setUser(newUser);
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setTokenCookie(newToken);
      console.log('[Foodie] Login success');
      showToast('Welcome back!', 'success');

      // Use startTransition to handle the redirect
      startTransition(() => {
        if (newUser.role === 'chef') {
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
        const { token: newToken, user: newUser } = response.data;
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setTokenCookie(newToken);
        showToast('Account created! Karibu.', 'success');
        startTransition(() => {
          if (newUser.role === 'chef') {
            router.replace('/chef/dashboard');
          } else {
            router.replace('/client/home');
          }
        });
        return { success: true };
      }

      if (response.error) {
        console.error('[Foodie] Registration API error:', response.error);
        showToast(response.error, 'error');
      }

      return {
        success: false,
        error: response.error || 'Registration failed',
        fieldErrors: response.errors,
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
    clearAuthState();
    startTransition(() => {
      router.replace('/auth');
    });
  };

  if (!hydrated) {
    return null;
  }

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
