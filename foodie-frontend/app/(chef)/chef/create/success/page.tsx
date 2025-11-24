'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Home, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ChefCreateSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dishId = searchParams.get('id');
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            router.push('/chef/dashboard');
        }
    }, [countdown, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1a0f0f] via-[#1b1814] to-[#0f0c0a] text-white flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Success Icon */}
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-green-500/20 flex items-center justify-center animate-pulse">
                        <CheckCircle className="h-12 w-12 text-green-500" />
                    </div>
                </div>

                {/* Success Message */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">Dish Posted Successfully!</h1>
                    <p className="text-white/70">
                        Your delicious creation is now live and ready to attract customers.
                    </p>
                </div>

                {/* Dish Info */}
                {dishId && (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                        <p className="text-sm text-white/60">Dish ID</p>
                        <p className="text-lg font-semibold text-orange-500">#{dishId}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="space-y-3 pt-4">
                    <Link
                        href="/chef/create"
                        className="flex items-center justify-center gap-2 w-full rounded-full bg-orange-500 hover:bg-orange-600 py-4 px-6 font-semibold text-white transition shadow-lg shadow-orange-500/20"
                    >
                        <Plus className="h-5 w-5" />
                        Create Another Dish
                    </Link>

                    <Link
                        href="/chef/dashboard"
                        className="flex items-center justify-center gap-2 w-full rounded-full bg-white/10 hover:bg-white/20 py-4 px-6 font-semibold text-white transition border border-white/10"
                    >
                        <Home className="h-5 w-5" />
                        Back to Dashboard
                    </Link>

                    <Link
                        href="/discover"
                        className="flex items-center justify-center gap-2 w-full rounded-full bg-white/5 hover:bg-white/10 py-3 px-6 font-medium text-white/70 hover:text-white transition"
                    >
                        View on Discover Page
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>

                {/* Auto-redirect Notice */}
                <p className="text-sm text-white/50">
                    Redirecting to dashboard in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
            </div>
        </div>
    );
}
