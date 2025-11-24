'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BackButtonProps {
    className?: string;
    label?: string;
}

export default function BackButton({ className = '', label }: BackButtonProps) {
    const router = useRouter();

    return (
        <button
            onClick={() => router.back()}
            className={`inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group ${className}`}
            aria-label="Go back"
        >
            <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                <ArrowLeft className="h-4 w-4" />
            </div>
            {label && <span className="hidden sm:inline">{label}</span>}
        </button>
    );
}
