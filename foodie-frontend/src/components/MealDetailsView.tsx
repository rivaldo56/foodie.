'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    X,
    Clock,
    Flame,
    ChefHat,
    Star,
    ChevronRight,
    Share2,
    Heart,
    Utensils,
    ArrowRight
} from 'lucide-react';
import { Meal } from '@/services/booking.service';
import { cn } from '@/lib/utils';

interface MealDetailsViewProps {
    meal: Meal;
    isOpen: boolean;
    onClose: () => void;
}

export default function MealDetailsView({ meal, isOpen, onClose }: MealDetailsViewProps) {
    const router = useRouter();
    const [isReviewsOpen, setIsReviewsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Parallax effect for hero image
    const { scrollY } = useScroll({
        container: containerRef,
    });

    const imageY = useTransform(scrollY, [0, 300], [0, 100]);
    const imageOpacity = useTransform(scrollY, [0, 300], [1, 0.5]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
                    />

                    {/* Main Modal Container */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-md h-[95vh] sm:h-[85vh] bg-surface-elevated rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Scrollable Content */}
                        <div
                            ref={containerRef}
                            className="flex-1 overflow-y-auto scrollbar-hide relative"
                        >
                            {/* Hero Section */}
                            <div className="relative h-[40vh] w-full overflow-hidden">
                                <motion.div
                                    style={{ y: imageY, opacity: imageOpacity }}
                                    className="absolute inset-0"
                                >
                                    {meal.image ? (
                                        <Image
                                            src={meal.image}
                                            alt={meal.name}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-surface-highlight flex items-center justify-center">
                                            <Utensils className="w-16 h-16 text-muted" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-surface-elevated via-transparent to-black/30" />
                                </motion.div>
                            </div>

                            {/* Content Container */}
                            <div className="relative px-6 pb-24 -mt-12 space-y-8">
                                {/* Title & Price Header */}
                                <div className="space-y-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <motion.h1
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-3xl font-bold text-white leading-tight"
                                        >
                                            {meal.name}
                                        </motion.h1>
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="flex flex-col items-end"
                                        >
                                            <span className="text-2xl font-bold text-accent">
                                                KSh {meal.price.toLocaleString()}
                                            </span>
                                            {meal.rating && (
                                                <div className="flex items-center gap-1 text-amber-400 text-sm font-medium">
                                                    <Star className="w-4 h-4 fill-current" />
                                                    {Number(meal.rating).toFixed(1)}
                                                </div>
                                            )}
                                        </motion.div>
                                    </div>

                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.25 }}
                                        className="flex items-center gap-3 text-sm text-muted"
                                    >
                                        <span className="px-3 py-1 rounded-full bg-surface-highlight border border-white/5">
                                            {meal.category}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            20-30 min
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Flame className="w-4 h-4 text-orange-500" />
                                            350 kcal
                                        </span>
                                    </motion.div>
                                </div>

                                {/* Action Buttons */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="grid grid-cols-2 gap-4"
                                >
                                    <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent text-white font-bold shadow-lg shadow-accent/20 hover:bg-accent-strong active:scale-[0.98] transition-all">
                                        <ChefHat className="w-5 h-5" />
                                        Book Chef
                                    </button>
                                    <button className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-surface-highlight text-white font-bold border border-white/10 hover:bg-white/10 active:scale-[0.98] transition-all">
                                        <Utensils className="w-5 h-5" />
                                        Cook It Yourself
                                    </button>
                                </motion.div>

                                {/* Description */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                    className="space-y-3"
                                >
                                    <h3 className="text-lg font-semibold text-white">About this dish</h3>
                                    <p className="text-muted leading-relaxed">
                                        {meal.description || "A masterfully crafted dish featuring premium local ingredients, balanced flavors, and an exquisite presentation that brings the restaurant experience directly to your dining table."}
                                    </p>
                                </motion.div>

                                {/* Chef Info */}
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    onClick={() => meal.chef && router.push(`/chefs/${meal.chef}`)}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-surface-highlight border border-white/5 cursor-pointer hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
                                            <ChefHat className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted">Crafted by</p>
                                            <p className="font-semibold text-white">{meal.chef_name || `Chef ${meal.chef}` || 'Master Chef'}</p>
                                        </div>
                                    </div>
                                    <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-accent group-hover:translate-x-1">
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </motion.div>

                                {/* More Like This */}
                                <div className="space-y-4 pt-4">
                                    <h3 className="text-lg font-semibold text-white">More Like This</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="aspect-[4/5] rounded-2xl bg-surface-highlight animate-pulse" />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Reviews Drawer Trigger */}
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-surface-elevated via-surface-elevated to-transparent"
                        >
                            <button
                                onClick={() => setIsReviewsOpen(true)}
                                className="w-full flex items-center justify-between p-4 rounded-2xl bg-surface-highlight border border-white/10 text-white hover:bg-white/5 transition-colors group"
                            >
                                <span className="font-semibold">Reviews (12)</span>
                                <div className="flex items-center gap-2 text-muted group-hover:text-white transition-colors">
                                    <span className="text-sm">Swipe to view</span>
                                    <ArrowRight className="w-4 h-4" />
                                </div>
                            </button>
                        </motion.div>

                        {/* Reviews Drawer */}
                        <AnimatePresence>
                            {isReviewsOpen && (
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                    className="absolute inset-0 z-30 bg-surface-elevated flex flex-col"
                                >
                                    <div className="flex items-center justify-between p-6 border-b border-white/5">
                                        <h2 className="text-xl font-bold text-white">Reviews</h2>
                                        <button
                                            onClick={() => setIsReviewsOpen(false)}
                                            className="p-2 rounded-full hover:bg-white/5 text-muted hover:text-white transition-colors"
                                        >
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="space-y-2 pb-6 border-b border-white/5 last:border-0">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-accent/20" />
                                                        <span className="font-medium text-white">User {i}</span>
                                                    </div>
                                                    <div className="flex gap-0.5 text-amber-400">
                                                        {[...Array(5)].map((_, j) => (
                                                            <Star key={j} className="w-3 h-3 fill-current" />
                                                        ))}
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted leading-relaxed">
                                                    Absolutely delicious! The flavors were perfectly balanced and the presentation was stunning. Highly recommended!
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
