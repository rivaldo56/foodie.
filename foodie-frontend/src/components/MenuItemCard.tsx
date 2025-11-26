'use client';

import { MenuItem } from '@/lib/api';
import Image from 'next/image';
import { Heart, Star, Truck, Store, Utensils, ChefHat } from 'lucide-react';
import { useState } from 'react';

interface MenuItemCardProps {
    item: MenuItem;
    onFavorite?: (id: number) => void;
    isFavorited?: boolean;
}

export default function MenuItemCard({ item, onFavorite, isFavorited = false, onClick }: MenuItemCardProps & { onClick?: () => void }) {
    const [favorited, setFavorited] = useState(isFavorited);

    const handleFavorite = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setFavorited(!favorited);
        onFavorite?.(item.id);
    };

    return (
        <div
            onClick={onClick}
            className={`group rounded-3xl border border-white/10 bg-white/5 overflow-hidden hover:border-orange-500/50 transition-all duration-300 ${onClick ? 'cursor-pointer' : ''}`}
        >
            {/* Image */}
            <div className="relative h-48 bg-white/5 overflow-hidden">
                {item.image ? (
                    <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="h-full w-full bg-surface-highlight flex items-center justify-center text-muted">
                        <Utensils className="h-12 w-12" />
                    </div>
                )}

                {/* Favorite Button */}
                <button
                    onClick={handleFavorite}
                    className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 transition backdrop-blur-sm z-10"
                >
                    <Heart
                        className={`h-5 w-5 ${favorited ? 'fill-red-500 text-red-500' : 'text-white'}`}
                    />
                </button>

                {/* Category Badge */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-orange-500/90 backdrop-blur-sm">
                    <p className="text-xs font-semibold text-white capitalize">
                        {item.category?.replace('_', ' ')}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Name and Price */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-white line-clamp-1">
                        {item.name}
                    </h3>
                    <p className="text-lg font-bold text-orange-500 whitespace-nowrap">
                        KES {item.price_per_serving}
                    </p>
                </div>

                {/* Description */}
                {item.description && (
                    <p className="text-sm text-white/60 line-clamp-2">
                        {item.description}
                    </p>
                )}

                {/* Chef Name */}
                {item.chef_name && (
                    <div className="flex items-center gap-2 text-sm text-white/70">
                        <ChefHat className="h-4 w-4 text-orange-500" />
                        <span>{item.chef_name}</span>
                    </div>
                )}

                {/* Ingredients */}
                {item.ingredients && item.ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {item.ingredients.slice(0, 3).map((ingredient, idx) => (
                            <span
                                key={idx}
                                className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/70"
                            >
                                {ingredient}
                            </span>
                        ))}
                        {item.ingredients.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-white/70">
                                +{item.ingredients.length - 3} more
                            </span>
                        )}
                    </div>
                )}

                {/* Fulfillment Options */}
                <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                    {item.delivery_available && (
                        <div className="flex items-center gap-1.5 text-xs text-green-400">
                            <Truck className="h-4 w-4" />
                            <span>Delivery</span>
                        </div>
                    )}
                    {item.pickup_available && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-400">
                            <Store className="h-4 w-4" />
                            <span>Pickup</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
