'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';

function RegisterForm() {
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role') === 'chef' ? 'chef' : 'client';

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'chef'>(initialRole);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'chef' || roleParam === 'client') {
      setRole(roleParam as 'client' | 'chef');
    }
  }, [searchParams]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const result = await register({
      email,
      username,
      full_name: fullName,
      password,
      password2: password,
      role,
    });

    if (!result.success) {
      setError(result.error ?? 'Registration failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-xl space-y-6 rounded-3xl border border-white/10 bg-black/40 p-8 text-white shadow-xl backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Create your Foodie account</h1>
          <p className="text-sm text-white/60">Select your role to personalise the experience.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 rounded-full border border-white/10 bg-white/5 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setRole('client')}
            className={`rounded-full px-4 py-2 transition ${role === 'client' ? 'bg-orange-500 text-white shadow-glow' : 'text-white/70 hover:text-white'}`}
          >
            Client
          </button>
          <button
            type="button"
            onClick={() => setRole('chef')}
            className={`rounded-full px-4 py-2 transition ${role === 'chef' ? 'bg-orange-500 text-white shadow-glow' : 'text-white/70 hover:text-white'}`}
          >
            Chef
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm text-white/70">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm text-white/70">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>
          </div>

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
            className="inline-flex w-full items-center justify-center rounded-full bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-xs text-white/60">
          Already have an account?{' '}
          <Link href="/login" className="text-orange-400 hover:text-orange-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}

