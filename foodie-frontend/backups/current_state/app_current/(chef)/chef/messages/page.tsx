'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function ChefMessagesPage() {
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
        <p className="text-xs uppercase tracking-[0.35em] text-orange-300/80">Messages</p>
        <h1 className="text-2xl font-semibold text-white">Coordinate with guests</h1>
      </header>
      <p className="text-sm text-white/70">
        Concierge and client chat threads will appear here so you can align on menus, logistics, and post-event feedback quickly.
      </p>
    </section>
  );
}
