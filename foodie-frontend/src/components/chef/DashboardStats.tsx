'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    subtitle?: string;
}

export default function DashboardStats({ title, value, icon, trend, subtitle }: StatCardProps) {
    return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:border-accent/40 hover:bg-white/10">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-white/60">{title}</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-xs text-white/50">{subtitle}</p>
                    )}
                </div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent">
                    {icon}
                </div>
            </div>

            {trend && (
                <div className="mt-4 flex items-center gap-2">
                    {trend.isPositive ? (
                        <TrendingUp className="h-4 w-4 text-emerald-400" />
                    ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trend.value > 0 ? '+' : ''}{trend.value}%
                    </span>
                    <span className="text-xs text-white/50">vs last month</span>
                </div>
            )}
        </div>
    );
}
