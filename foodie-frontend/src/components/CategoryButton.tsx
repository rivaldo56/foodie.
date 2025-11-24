'use client';

import { LucideIcon } from 'lucide-react';

interface CategoryButtonProps {
    icon: LucideIcon;
    label: string;
    isActive?: boolean;
    onClick?: () => void;
}

export default function CategoryButton({ icon: Icon, label, isActive = false, onClick }: CategoryButtonProps) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
        >
            <Icon className="h-6 w-6" />
            <span className="text-xs font-medium whitespace-nowrap">{label}</span>
        </button>
    );
}
