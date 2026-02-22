'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, DollarSign, UtensilsCrossed, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DashboardCounts {
  experiences: number;
  bookings: number;
  revenue: number;
  recentBookings: { id: string; total_price: number; status: string; date_time: string; menu?: { name: string } }[];
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState<DashboardCounts>({
    experiences: 0,
    bookings: 0,
    revenue: 0,
    recentBookings: [],
  });

  useEffect(() => {
    async function fetchDashboard() {
      const [expRes, bookCountRes, revenueRes, recentRes] = await Promise.all([
        supabase.from('experiences').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('total_price').eq('status', 'completed'),
        supabase
          .from('bookings')
          .select('id, total_price, status, date_time, menu:menus(name)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const revenueList = revenueRes.data ?? [];
      const completedRevenue = revenueList.reduce((sum, b) => sum + Number(b.total_price), 0);

      setCounts({
        experiences: expRes.count ?? 0,
        bookings: bookCountRes.count ?? 0,
        revenue: completedRevenue,
        recentBookings: (recentRes.data ?? []).map((r: Record<string, unknown>) => ({
          id: String(r.id),
          total_price: Number(r.total_price),
          status: String(r.status),
          date_time: String(r.date_time),
          menu: r.menu as { name: string } | undefined,
        })),
      });
      setLoading(false);
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-10 w-10 animate-spin text-[#ff7642]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">Dashboard</h1>
        <p className="text-[#cbd5f5] mt-1">Overview of your platform performance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Completed revenue"
          value={`KES ${counts.revenue.toLocaleString()}`}
          description="From completed bookings"
          icon={<DollarSign className="h-5 w-5 text-[#ff7642]" />}
        />
        <StatsCard
          title="Bookings"
          value={String(counts.bookings)}
          description="Total bookings"
          icon={<CalendarDays className="h-5 w-5 text-[#4ade80]" />}
        />
        <StatsCard
          title="Experiences"
          value={String(counts.experiences)}
          description="Curated experiences"
          icon={<UtensilsCrossed className="h-5 w-5 text-[#ff7642]" />}
        />
        <StatsCard
          title="Quick links"
          value="—"
          description="Manage experiences & bookings below"
          icon={<CalendarDays className="h-5 w-5 text-[#cbd5f5]" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-[#16181d] border-white/5 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-[#f9fafb]">Recent Bookings</CardTitle>
            <Link href="/admin/bookings" className="text-sm text-[#ff7642] hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {counts.recentBookings.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-white/5 rounded-xl bg-white/5">
                <span className="text-[#94a3b8]">No bookings yet</span>
              </div>
            ) : (
              <ul className="space-y-3">
                {counts.recentBookings.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#1f2228] border border-white/5"
                  >
                    <div>
                      <p className="font-medium text-[#f9fafb]">{b.menu?.name ?? 'Booking'}</p>
                      <p className="text-xs text-[#94a3b8]">
                        {new Date(b.date_time).toLocaleDateString()} · {b.status}
                      </p>
                    </div>
                    <span className="font-semibold text-[#ff7642]">KES {b.total_price.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3 bg-[#16181d] border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle className="text-[#f9fafb]">Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[#cbd5f5] mb-4">Manage your marketplace content.</p>
            <div className="space-y-2">
              <Link
                href="/admin/experiences"
                className="block w-full rounded-lg border border-white/10 bg-[#1f2228] px-4 py-3 text-sm font-medium text-[#f9fafb] hover:bg-[#2a2f37] transition-colors"
              >
                Experiences
              </Link>
              <Link
                href="/admin/meals"
                className="block w-full rounded-lg border border-white/10 bg-[#1f2228] px-4 py-3 text-sm font-medium text-[#f9fafb] hover:bg-[#2a2f37] transition-colors"
              >
                Meals
              </Link>
              <Link
                href="/admin/bookings"
                className="block w-full rounded-lg border border-white/10 bg-[#1f2228] px-4 py-3 text-sm font-medium text-[#f9fafb] hover:bg-[#2a2f37] transition-colors"
              >
                Bookings
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="bg-[#16181d] border-white/5 hover:border-[#ff7642]/30 transition-all hover:shadow-glow/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[#cbd5f5]">{title}</CardTitle>
        <div className="p-2 rounded-lg bg-[#1f2228] border border-white/5">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#f9fafb]">{value}</div>
        <p className="text-xs text-[#94a3b8] mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
