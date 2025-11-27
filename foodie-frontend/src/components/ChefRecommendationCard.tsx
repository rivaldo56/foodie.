'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, Heart, ChefHat, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { chefService } from '@/services/chef.service';

interface ChefRecommendationCardProps {
    chef: {
        id: number;
        user?: {
            full_name: string;
        };
        name?: string;
        profile_picture?: string;
        specialties?: string[];
        average_rating?: number;
        city?: string;
        state?: string;
        hourly_rate?: number;
    };
    matchScore: number;
}

export default function ChefRecommendationCard({ chef, matchScore }: ChefRecommendationCardProps) {
    const [isFavorited, setIsFavorited] = useState(false);

    const displayName = chef.user?.full_name || chef.name || `Chef #${chef.id}`;
    const location = chef.city && chef.state ? `${chef.city}, ${chef.state}` : 'Nairobi, Kenya';
    const specialty = chef.specialties?.[0] || 'Signature cuisine';
    const rating = Number(chef.average_rating) || 4.8;
    const price = chef.hourly_rate || 2500;

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const newState = !isFavorited;
        setIsFavorited(newState);

        try {
            const response = await chefService.toggleFavorite(chef.id);
            if (response.error) {
                setIsFavorited(!newState);
                console.error('Failed to toggle favorite:', response.error);
            } else if (response.data) {
                setIsFavorited(response.data.is_favorited);
            }
        } catch (error) {
            setIsFavorited(!newState);
            console.error('Error toggling favorite:', error);
        }
    };

    return (
        <Link href={`/chefs/${chef.id}`} className="group block flex-shrink-0 w-[280px]">
            <article className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
                <div className="relative h-48">
                    {chef.profile_picture ? (
                        <Image
                            src={chef.profile_picture}
                            alt={displayName}
                            fill
                            className="object-cover"
                            sizes="280px"
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-orange-900/40 to-orange-700/40 flex items-center justify-center text-6xl">
                            <ChefHat className="h-12 w-12 text-muted" />
                        </div>
                    )}

                    {/* Match Badge */}
                    <div className="absolute top-3 left-3 bg-orange-500 text-white px-3 py-1 text-xs font-semibold rounded-full shadow-lg flex items-center">
                        <Sparkles className="h-3 w-3 mr-1" /> {Math.round(matchScore * 100)}% Match
                    </div>

                    {/* Favorite Button */}
                    <button
                        onClick={handleToggleFavorite}
                        className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors z-10"
                        aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                    >
                        <Heart
                            className={`h-5 w-5 transition-colors ${isFavorited ? "fill-red-500 text-red-500" : "text-white"
                                }`}
                        />
                    </button>
                </div>

                <div className="p-4 space-y-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white truncate">
                            {displayName}
                        </h3>
                        <p className="text-sm text-white/60">
                            {specialty}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 text-sm">
                        <span className="inline-flex items-center gap-1 text-amber-400 font-semibold">
                            <Star className="h-4 w-4 fill-amber-400" />
                            {(rating || 4.8).toFixed(1)}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-white/20" />
                        <span className="inline-flex items-center gap-1 text-white/70">
                            <MapPin className="h-4 w-4" />
                            {location}
                        </span>
                    </div>

                    <div className="pt-2 border-t border-white/10">
                        <p className="text-sm text-white/70">
                            From <span className="text-white font-semibold">KES {price.toLocaleString()}</span>/hr
                        </p>
                    </div>
                </div>
            </article>
        </Link>
    );
}
