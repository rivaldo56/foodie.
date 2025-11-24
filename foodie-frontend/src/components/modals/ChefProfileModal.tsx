'use client';

import { X, Star, MapPin, Calendar, MessageCircle, Award, Utensils } from 'lucide-react';
import Image from 'next/image';
import type { Chef } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface ChefProfileModalProps {
    chef: Chef & {
        signature_dishes?: Array<{
            id: number;
            name: string;
            price: number;
            image?: string;
        }>;
    };
    isOpen: boolean;
    onClose: () => void;
    onBook: () => void;
    onMessage: () => void;
}

export default function ChefProfileModal({
    chef,
    isOpen,
    onClose,
    onBook,
    onMessage,
}: ChefProfileModalProps) {
    const displayName = chef.user?.full_name || `Chef #${chef.id}`;
    const location = chef.city && chef.state ? `${chef.city}, ${chef.state}` : 'Nairobi, Kenya';
    const rating = Number(chef.average_rating || 0);
    const reviewCount = chef.total_reviews || 0;
    const specialties = chef.specialties || [];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
                        className="relative w-full max-w-2xl max-h-[90vh] bg-surface-elevated rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors text-white/80 hover:text-white"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* Scrollable Content */}
                        <div className="overflow-y-auto flex-1 scrollbar-hide">
                            {/* Header Section */}
                            <div className="p-6 sm:p-8 space-y-6">
                                <div className="flex flex-col sm:flex-row items-start gap-6">
                                    {/* Profile Image */}
                                    <div className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden flex-shrink-0 border-4 border-accent/20 shadow-glow">
                                        {chef.profile_picture ? (
                                            <Image
                                                src={chef.profile_picture}
                                                alt={displayName}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full bg-surface-highlight flex items-center justify-center text-4xl sm:text-5xl">
                                                👨‍🍳
                                            </div>
                                        )}
                                    </div>

                                    {/* Chef Info */}
                                    <div className="flex-1 space-y-3 w-full">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{displayName}</h2>
                                            {chef.is_verified && (
                                                <span className="px-2.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20 flex items-center gap-1">
                                                    <Award className="h-3 w-3" /> Verified
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                                            <div className="flex items-center gap-1.5">
                                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                                <span className="font-semibold text-white">{rating > 0 ? rating.toFixed(1) : 'New'}</span>
                                                <span className="text-muted-strong">({reviewCount} reviews)</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="h-4 w-4 text-accent" />
                                                <span>{location}</span>
                                            </div>
                                        </div>

                                        {/* Specialties */}
                                        {specialties.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {specialties.map((specialty, index) => (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-1 rounded-full bg-surface text-muted-strong text-xs font-medium border border-white/5"
                                                    >
                                                        {specialty}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* About Section */}
                                <div className="space-y-3 pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-accent text-xl">👨‍🍳</span>
                                        <h3 className="text-lg font-semibold text-white">About</h3>
                                    </div>
                                    <p className="text-muted leading-relaxed">
                                        {chef.bio || "This chef hasn't added a bio yet."}
                                    </p>
                                </div>

                                {/* Achievements Section */}
                                <div className="space-y-3 pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-accent text-xl">🏆</span>
                                        <h3 className="text-lg font-semibold text-white">Achievements</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {chef.experience_years ? (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/20 rounded-xl">
                                                {chef.experience_years}+ Years Exp.
                                            </div>
                                        ) : null}
                                        {chef.is_verified && (
                                            <span className="px-4 py-2 rounded-xl bg-surface text-muted-strong text-sm font-medium border border-white/5">
                                                Background Checked
                                            </span>
                                        )}
                                        {rating >= 4.8 && (
                                            <span className="px-4 py-2 rounded-xl bg-surface text-muted-strong text-sm font-medium border border-white/5">
                                                Top Rated
                                            </span>
                                        )}
                                        {chef.total_bookings && chef.total_bookings > 50 && (
                                            <span className="px-4 py-2 rounded-xl bg-surface text-muted-strong text-sm font-medium border border-white/5">
                                                Popular Choice
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Signature Dishes Section */}
                                {chef.signature_dishes && chef.signature_dishes.length > 0 && (
                                    <div className="space-y-4 pt-6 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-accent text-xl">🍽️</span>
                                            <h3 className="text-lg font-semibold text-white">Signature Dishes</h3>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                            {chef.signature_dishes.map((dish) => (
                                                <div
                                                    key={dish.id}
                                                    className="group rounded-2xl overflow-hidden bg-surface border border-white/5 hover:border-accent/50 transition-colors"
                                                >
                                                    <div className="relative h-28 sm:h-32">
                                                        {dish.image ? (
                                                            <Image
                                                                src={dish.image}
                                                                alt={dish.name}
                                                                fill
                                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full bg-surface-highlight flex items-center justify-center text-3xl">
                                                                <Utensils className="text-accent/40" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-3 space-y-1">
                                                        <h4 className="text-sm font-semibold text-white truncate">
                                                            {dish.name}
                                                        </h4>
                                                        <p className="text-accent font-semibold text-sm">
                                                            KES {dish.price.toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 bg-surface/50 backdrop-blur-md border-t border-white/5 flex gap-4 z-20">
                            <button
                                onClick={onBook}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-accent hover:bg-accent-strong text-white font-semibold rounded-xl transition-all shadow-lg shadow-accent/20 hover:shadow-accent/40 active:scale-[0.98]"
                            >
                                <Calendar className="h-5 w-5" />
                                Book Now
                            </button>
                            <button
                                onClick={onMessage}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-surface hover:bg-white/5 text-white font-semibold rounded-xl transition-all border border-white/10 hover:border-white/20 active:scale-[0.98]"
                            >
                                <MessageCircle className="h-5 w-5" />
                                Message
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
