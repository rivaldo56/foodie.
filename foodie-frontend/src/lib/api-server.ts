/**
 * Server-side API client for Next.js
 * Uses fetch instead of axios for server components
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';

interface ApiResponse<T> {
    data?: T;
    error?: string;
    status: number;
}

/**
 * Generic server-side API request
 */
async function serverApiRequest<T>(
    endpoint: string,
    options?: RequestInit
): Promise<ApiResponse<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            next: { revalidate: 60 }, // Revalidate every 60 seconds
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return {
                error: errorData.detail || errorData.error || `Request failed: ${response.status}`,
                status: response.status,
            };
        }

        const data = await response.json();
        return {
            data: data as T,
            status: response.status,
        };
    } catch (error) {
        return {
            error: error instanceof Error ? error.message : 'Network error occurred',
            status: 0,
        };
    }
}

/**
 * Get all chefs (server-side)
 */
export async function getChefs() {
    return serverApiRequest<any[]>('/chefs/');
}

/**
 * Get chef by ID (server-side)
 */
export async function getChefById(id: number) {
    return serverApiRequest<any>(`/chefs/${id}/`);
}

/**
 * Get all meals (server-side)
 */
export async function getMeals(params?: { category?: string; search?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/meals/?${queryString}` : '/meals/';

    return serverApiRequest<any[]>(endpoint);
}

/**
 * Get meal by ID (server-side)
 */
export async function getMealById(id: number) {
    return serverApiRequest<any>(`/meals/${id}/`);
}

/**
 * Health check (server-side)
 */
export async function checkHealth() {
    return serverApiRequest<{ status: string }>('/');
}
