'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ChefDashboardPage() {
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
        <p className="text-xs uppercase tracking-[0.35em] text-orange-300/80">Dashboard Overview</p>
        <h1 className="text-2xl font-semibold text-white">Business performance summary</h1>
      </header>
      <p className="text-sm text-white/70">
        Cards summarising revenue, bookings, top dishes, and customer feedback will appear once analytics are wired in.
      </p>
    </section>
  );
}
