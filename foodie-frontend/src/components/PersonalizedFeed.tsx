'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ChefCard from '@/components/ChefCard';
import { TrendingUp, Sparkles, Flame } from 'lucide-react';
import type { Chef } from '@/services/chef.service';

interface RecommendedChef {
    chef: Chef;
    recommendation_score: number;
    score_breakdown: {
        collaborative: number;
        content_based: number;
        popularity: number;
        recency: number;
        diversity: number;
    };
}

interface TrendingChef {
    chef: Chef;
    trending_score: number;
    recent_bookings: number;
    growth_velocity: number;
    badge: string;
}

export default function PersonalizedFeed() {
    const { user, isAuthenticated } = useAuth();
    const [recommendations, setRecommendations] = useState<RecommendedChef[]>([]);
    const [trending, setTrending] = useState<TrendingChef[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'foryou' | 'trending'>('foryou');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const observerTarget = useRef<HTMLDivElement>(null);

    const trackView = async (chefId: number) => {
        if (!isAuthenticated) return;

        try {
            const token = localStorage.getItem('token');
            await fetch('http://127.0.0.1:8000/api/ai/recommendations/track/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Token ${token}`,
                },
                body: JSON.stringify({
                    content_type: 'chef',
                    content_id: chefId,
                    interaction_type: 'view',
                    duration_seconds: 3,
                }),
            });
        } catch (error) {
            console.error('Failed to track view:', error);
        }
    };

    const fetchRecommendations = async (pageNum: number = 1) => {
        if (!isAuthenticated) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `http://127.0.0.1:8000/api/ai/recommendations/feed/?type=chef&limit=10`,
                {
                    headers: {
                        Authorization: `Token ${token}`,
                    },
                }
            );

            const data = await response.json();

            if (response.ok) {
                if (pageNum === 1) {
                    setRecommendations(data.recommendations);
                } else {
                    setRecommendations((prev) => [...prev, ...data.recommendations]);
                }
                setHasMore(data.recommendations.length === 10);
            }
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTrending = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                'http://127.0.0.1:8000/api/ai/recommendations/trending/?type=chef&limit=10'
            );

            const data = await response.json();

            if (response.ok) {
                setTrending(data.trending);
            }
        } catch (error) {
            console.error('Failed to fetch trending:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'foryou' && isAuthenticated) {
            fetchRecommendations(1);
        } else if (activeTab === 'trending') {
            fetchTrending();
        }
    }, [activeTab, isAuthenticated]);

    // Infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading && activeTab === 'foryou') {
                    setPage((prev) => prev + 1);
                    fetchRecommendations(page + 1);
                }
            },
            { threshold: 0.5 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading, page, activeTab]);

    // Track views when chef cards come into view
    useEffect(() => {
        const observers: IntersectionObserver[] = [];

        recommendations.forEach((item) => {
            const element = document.getElementById(`chef-${item.chef.id}`);
            if (element) {
                const observer = new IntersectionObserver(
                    (entries) => {
                        if (entries[0].isIntersecting) {
                            trackView(item.chef.id);
                            observer.disconnect();
                        }
                    },
                    { threshold: 0.7 }
                );
                observer.observe(element);
                observers.push(observer);
            }
        });

        return () => observers.forEach((obs) => obs.disconnect());
    }, [recommendations]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a0f0f] via-[#0f0c0a] to-black">
            <div className="mx-auto max-w-4xl px-4 py-8">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="mb-2 text-4xl font-bold text-white">Discover Chefs</h1>
                    <p className="text-white/60">Personalized recommendations just for you</p>
                </div>

                {/* Tabs */}
                <div className="mb-8 flex gap-4">
                    <button
                        onClick={() => setActiveTab('foryou')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-semibold transition ${activeTab === 'foryou'
                            ? 'bg-accent text-white shadow-glow'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                            }`}
                    >
                        <Sparkles className="h-5 w-5" />
                        For You
                    </button>
                    <button
                        onClick={() => setActiveTab('trending')}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-semibold transition ${activeTab === 'trending'
                            ? 'bg-accent text-white shadow-glow'
                            : 'bg-white/10 text-white/60 hover:bg-white/20'
                            }`}
                    >
                        <Flame className="h-5 w-5" />
                        Trending
                    </button>
                </div>

                {/* Content */}
                {isLoading && page === 1 ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'foryou' && (
                            <div className="space-y-6">
                                {recommendations.map((item, index) => (
                                    <div
                                        key={item.chef.id}
                                        id={`chef-${item.chef.id}`}
                                        className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-accent/40"
                                    >
                                        <ChefCard chef={item.chef} />

                                        {/* Recommendation Score */}
                                        <div className="mt-4 border-t border-white/10 pt-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white/60">Match Score:</span>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-accent to-accent-strong"
                                                            style={{ width: `${item.recommendation_score * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="font-semibold text-accent">
                                                        {Math.round(item.recommendation_score * 100)}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Score Breakdown (expandable) */}
                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-xs text-white/40 hover:text-white/60">
                                                    Why this chef?
                                                </summary>
                                                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                                                    <div className="flex justify-between">
                                                        <span className="text-white/60">Similar tastes:</span>
                                                        <span className="text-white">{Math.round(item.score_breakdown.collaborative * 100)}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-white/60">Your preferences:</span>
                                                        <span className="text-white">{Math.round(item.score_breakdown.content_based * 100)}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-white/60">Popularity:</span>
                                                        <span className="text-white">{Math.round(item.score_breakdown.popularity * 100)}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-white/60">Freshness:</span>
                                                        <span className="text-white">{Math.round(item.score_breakdown.recency * 100)}%</span>
                                                    </div>
                                                </div>
                                            </details>
                                        </div>
                                    </div>
                                ))}

                                {/* Infinite scroll trigger */}
                                <div ref={observerTarget} className="py-4 text-center">
                                    {isLoading && <p className="text-white/60">Loading more...</p>}
                                    {!hasMore && <p className="text-white/40">You've seen it all! 🎉</p>}
                                </div>
                            </div>
                        )}

                        {activeTab === 'trending' && (
                            <div className="space-y-6">
                                {trending.map((item) => (
                                    <div
                                        key={item.chef.id}
                                        className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-accent/40"
                                    >
                                        <div className="mb-4 flex items-center gap-2">
                                            <span className="text-2xl">{item.badge}</span>
                                            <span className="text-sm font-semibold text-accent">
                                                {item.recent_bookings} bookings in 24h
                                            </span>
                                            {item.growth_velocity > 1 && (
                                                <span className="flex items-center gap-1 text-xs text-emerald-400">
                                                    <TrendingUp className="h-3 w-3" />
                                                    +{Math.round(item.growth_velocity * 100)}% growth
                                                </span>
                                            )}
                                        </div>

                                        <ChefCard chef={item.chef} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
