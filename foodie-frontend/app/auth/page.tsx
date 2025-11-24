'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const CTA_CARD = [
  {
    heading: 'I am looking for chefs',
    description: 'Discover curated culinary experiences tailored for food lovers.',
    primaryHref: '/login',
    primaryLabel: 'Sign in',
    secondaryHref: '/register?role=client',
    secondaryLabel: 'Create client account',
  },
  {
    heading: 'I am a chef',
    description: 'Showcase your talents, manage bookings, and delight new clients.',
    primaryHref: '/login?role=chef',
    primaryLabel: 'Chef sign in',
    secondaryHref: '/register?role=chef',
    secondaryLabel: 'Join as a chef',
  },
];

export default function AuthLanding() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'chef') {
        router.replace('/chef/dashboard');
      } else {
        router.replace('/client/home');
      }
    }
  }, [isAuthenticated, router, user?.role]);

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-gray-100 px-4 py-12">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-10">
        <div className="text-center space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-orange-600">
            Foodie access portal
          </p>
          <h1 className="text-3xl font-semibold text-gray-900 sm:text-4xl">
            Choose how you want to explore Foodie
          </h1>
          <p className="max-w-xl text-sm text-gray-600">
            Access your personalized experience whether you are discovering memorable meals or managing your chef business.
          </p>
        </div>

        <div className="grid w-full gap-6 lg:grid-cols-2">
          {CTA_CARD.map((card) => (
            <section
              key={card.heading}
              className="rounded-3xl border border-orange-100 bg-white/80 p-8 shadow-[0_20px_60px_rgba(244,114,33,0.15)] backdrop-blur"
            >
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900">{card.heading}</h2>
                <p className="text-sm text-gray-600">{card.description}</p>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href={card.primaryHref}
                  className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  {card.primaryLabel}
                </Link>
                <Link
                  href={card.secondaryHref}
                  className="inline-flex items-center justify-center rounded-full border border-orange-200 px-5 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
                >
                  {card.secondaryLabel}
                </Link>
              </div>
            </section>
          ))}
        </div>

        <p className="text-xs text-gray-500">
          Questions? <Link href="/contact" className="font-semibold text-orange-600 hover:text-orange-700">Talk to our concierge</Link>
        </p>
      </div>
    </div>
  );
}
