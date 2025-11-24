'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, ShoppingBag, MessageCircle, User } from 'lucide-react';

const CLIENT_LINKS = [
  { href: '/client/home', label: 'Home', icon: Home },
  { href: '/client/discover', label: 'Discover', icon: Compass },
  { href: '/client/order', label: 'Bookings', icon: ShoppingBag },
  { href: '/client/messages', label: 'Messages', icon: MessageCircle },
  { href: '/client/profile', label: 'Profile', icon: User },
];

export default function ClientBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center bg-black/50 pb-4 pt-2 backdrop-blur">
      <div className="flex w-full max-w-xl items-center justify-between gap-2 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-xs font-medium text-white/70">
        {CLIENT_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-full px-2 py-1 transition ${active ? 'text-white' : 'hover:text-white'}`}
            >
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${
                  active ? 'bg-orange-500 text-white shadow-glow' : 'bg-white/10 text-white/70'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
