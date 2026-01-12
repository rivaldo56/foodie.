'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import StatusLight from './StatusLight';
import { Bell, LogOut, MessageCircle, User, Home, Compass, ChefHat, UtensilsCrossed, Menu, X, Utensils, type LucideIcon } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const displayName = user?.full_name || user?.username || 'Guest';
  const pathname = usePathname();

  const isChef = user?.role === 'chef';

  const navItems: NavItem[] = isChef
    ? [
      { href: '/chef/dashboard', label: 'Dashboard', icon: UtensilsCrossed },
      { href: '/chef/discover', label: 'Discover', icon: Compass },
      { href: '/chef/bookings', label: 'Bookings', icon: Calendar },
      { href: '/chef/messages', label: 'Messages', icon: MessageCircle },
      { href: '/chef/profile', label: 'Profile', icon: User },
    ]
    : [
      { href: '/client/home', label: 'Home', icon: Home },
      { href: '/client/discover', label: 'Discover', icon: Compass },
      { href: '/kitchen', label: 'Kitchen', icon: ChefHat },
      { href: '/client/messages', label: 'Messages', icon: MessageCircle },
      { href: '/client/profile', label: 'Profile', icon: User },
    ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-surface/80 border-b border-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Utensils className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-gray-900">Foodie</span>
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 text-sm text-muted">
              <StatusLight />
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-surface-highlight px-4 py-2 text-sm font-medium text-muted hover:bg-accent-soft transition"
              >
                <Bell className="h-4 w-4" />
                Notifications
              </button>
            </div>

            <button
              type="button"
              onClick={() => router.push(isChef ? '/chef/messages' : '/messages')}
              className="inline-flex items-center justify-center rounded-full bg-surface-highlight p-2 text-muted hover:text-white transition"
              aria-label="Messages"
            >
              <MessageCircle className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 rounded-full bg-surface-elevated px-3 py-2 soft-border">
              <div className="h-10 w-10 rounded-full bg-accent-soft text-accent flex items-center justify-center text-sm font-semibold">
                {displayName
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-white">{displayName}</p>
                <p className="text-xs text-muted">{isAuthenticated ? 'Food Explorer' : 'Guest mode'}</p>
              </div>
              {isAuthenticated ? (
                <button onClick={logout} className="ml-2 text-muted hover:text-danger transition" aria-label="Logout">
                  <LogOut className="h-5 w-5" />
                </button>
              ) : (
                <Link href="/login" className="ml-2 text-sm font-semibold text-accent hover:text-accent-strong">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-3 text-sm text-muted">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 transition ${active ? 'bg-white/10 text-white font-medium' : 'hover:text-white'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
