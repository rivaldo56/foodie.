'use client';

import ChefBottomNav from '@/components/layout/ChefBottomNav';
import { usePathname } from 'next/navigation';

export default function ChefShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname?.includes('/onboarding');

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-background text-white">
        <main className="w-full h-full">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pb-20 sm:pb-24">
      <header className="border-b border-white/10 bg-black/40 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3 sm:py-4 md:py-5">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] text-white/50 mb-0.5 sm:mb-1">Chef Console</p>
            <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold truncate">Run your culinary business</h1>
            <p className="hidden sm:block text-xs text-white/50 truncate">Insights, bookings, and guest experiences in one place</p>
          </div>
          <span className="hidden md:block text-xs text-white/50 whitespace-nowrap ml-4">Grow bookings • Track performance</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 sm:space-y-8 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">{children}</main>

      <ChefBottomNav />
    </div>
  );
}
