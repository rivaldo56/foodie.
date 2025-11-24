'use client';

import Link from 'next/link';

export default function AuthIndexPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-16 text-center text-white">
      <div className="max-w-lg space-y-6">
        <h1 className="text-3xl font-semibold">Choose how you want to continue</h1>
        <p className="text-sm text-white/70">
          Access curated Foodie experiences. Use your existing account or create a new one for clients and chefs.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-orange-400"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-white/40 hover:text-white"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
