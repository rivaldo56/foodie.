import { apiRequest, type ApiResponse } from '@/lib/api';

/**
 * Recommendation API Types
 */
export interface RecommendationScoreBreakdown {
    collaborative: number;
    content_based: number;
    popularity: number;
    recency: number;
    diversity: number;
}

export interface ChefRecommendation {
    chef: any; // Will use Chef type from api.ts
    recommendation_score: number;
    score_breakdown: RecommendationScoreBreakdown;
}

export interface PersonalizedFeedResponse {
    recommendations: ChefRecommendation[];
    total: number;
    algorithm: string;
}

export interface TrendingChef {
    chef: any;
    trending_score: number;
    recent_bookings: number;
    growth_velocity: number;
    badge: string;
}

export interface TrendingFeedResponse {
    trending: TrendingChef[];
    total: number;
    timeframe: string;
}

export interface UserPreferences {
    preferred_cuisines: string[];
    preferred_price_range: {
        min: number;
        max: number;
    };
    dietary_patterns: string[];
    confidence_level: number;
    interaction_count: number;
    last_updated: string;
}

export interface TrackInteractionPayload {
    content_type: 'chef' | 'meal';
    content_id: number;
    interaction_type: 'view' | 'like' | 'book' | 'share' | 'skip';
    duration_seconds?: number;
    session_id?: string;
}

/**
 * Get personalized feed of chef recommendations
 */
export async function getPersonalizedFeed(
    type: 'chef' | 'meal' = 'chef',
    limit: number = 20
): Promise<ApiResponse<PersonalizedFeedResponse>> {
    return apiRequest<PersonalizedFeedResponse>(
        {
            url: `/ai/recommendations/feed/?type=${type}&limit=${limit}`,
            method: 'GET',
        },
        true
    );
}

/**
 * Get trending chefs/meals
 */
export async function getTrendingFeed(
    type: 'chef' | 'meal' = 'chef',
    limit: number = 10
): Promise<ApiResponse<TrendingFeedResponse>> {
    return apiRequest<TrendingFeedResponse>(
        {
            url: `/ai/recommendations/trending/?type=${type}&limit=${limit}`,
            method: 'GET',
        },
        false
    );
}

/**
 * Track user interaction for recommendation learning
 */
export async function trackInteraction(
    payload: TrackInteractionPayload
): Promise<ApiResponse<{ message: string; learning_status: string }>> {
    return apiRequest<{ message: string; learning_status: string }>(
        {
            url: '/ai/recommendations/track/',
            method: 'POST',
            data: payload,
        },
        true
    );
}

/**
 * Get user's learned preferences
 */
export async function getUserPreferences(): Promise<ApiResponse<UserPreferences>> {
    return apiRequest<UserPreferences>(
        {
            url: '/ai/recommendations/preferences/',
            method: 'GET',
        },
        true
    );
}

/**
 * Get similar chefs to a given chef
 */
export async function getSimilarChefs(
    chefId: number
): Promise<ApiResponse<{ similar_chefs: ChefRecommendation[]; total: number }>> {
    return apiRequest<{ similar_chefs: ChefRecommendation[]; total: number }>(
        {
            url: `/ai/recommendations/similar/${chefId}/`,
            method: 'GET',
        },
        false
    );
}

export const recommendationsApi = {
    getPersonalizedFeed,
    getTrendingFeed,
    trackInteraction,
    getUserPreferences,
    getSimilarChefs,
};
