'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ClientOrderPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [loading, isAuthenticated, router]);

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.35em] text-orange-300/80">Three-Tap Booking</p>
        <h1 className="text-2xl font-semibold text-white">Reserve your next experience</h1>
      </header>
      <p className="text-sm text-white/70">
        A streamlined checkout flow will soon live here, guiding guests through chef selection, schedule confirmation, and secure payment.
      </p>
    </section>
  );
}
