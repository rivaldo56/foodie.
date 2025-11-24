'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const result = await login({ email, password });
    if (!result.success) {
      setError(result.error ?? 'Unable to login.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/10 bg-black/40 p-8 text-white shadow-xl backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Sign in to Foodie</h1>
          <p className="text-sm text-white/60">Access client and chef experiences with a single account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-white/70">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-white/70">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
          </div>

          {error && <p className="rounded-lg bg-red-500/20 px-3 py-2 text-sm text-red-300">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-white/60">
          No account yet?{' '}
          <Link href="/register" className="text-orange-400 hover:text-orange-300">
            Create one now
          </Link>
        </p>
      </div>
    </div>
  );
}
