'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, ChefHat, User } from 'lucide-react';

export default function BottomDock() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { label: 'Home', path: '/client/home', icon: Home },
        { label: 'Discover', path: '/discover', icon: Compass },
        { label: 'Kitchen', path: '/kitchen', icon: ChefHat },
        { label: 'Profile', path: '/client/profile', icon: User },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-surface/80 backdrop-blur-xl md:hidden">
            <div className="flex items-center justify-around p-2">
                {navItems.map(({ label, path, icon: Icon }) => (
                    <Link
                        key={path}
                        href={path}
                        className={`flex flex-col items-center gap-1 rounded-xl p-2 transition ${isActive(path) ? 'text-accent' : 'text-muted hover:text-white'
                            }`}
                    >
                        <Icon className="h-6 w-6" />
                        <span className="text-[10px] font-medium">{label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}