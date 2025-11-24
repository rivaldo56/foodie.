'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-500/10 via-background to-background px-6 py-16 text-center">
      <div className="max-w-2xl space-y-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-orange-400">
          <Sparkles className="h-3.5 w-3.5" /> Foodie Marketplace
        </span>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">
          Private chefs on demand for unforgettable dining experiences.
        </h1>
        <p className="text-sm text-white/70 sm:text-base">
          Foodie connects food lovers with world-class chefs. Choose your role to explore tailored dashboards built for clients and chefs.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-400"
          >
            Client & Chef Login
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
