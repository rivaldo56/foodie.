'use client';

import { useEffect, useMemo, useState } from 'react';
import { getUserOrders, getMeals, Order, Meal } from '@/services/booking.service';
import ProtectedRoute from '@/components/ProtectedRoute';
import OrderCard from '@/components/OrderCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import BottomDock from '@/components/BottomDock';
import ChatAssistantFab from '@/components/ChatAssistantFab';
import Link from 'next/link';

function OrdersPageContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meals, setMeals] = useState<Record<number, Meal>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const ordersResponse = await getUserOrders();
      if (ordersResponse.data) {
        setOrders(ordersResponse.data);

        const mealsResponse = await getMeals();
        if (mealsResponse.data) {
          setMeals(
            mealsResponse.data.reduce((acc, meal) => {
              acc[meal.id] = meal;
              return acc;
            }, {} as Record<string | number, Meal>)
          );
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const upcoming = orders.filter((order) => order.status !== 'cancelled').length;
    const completed = orders.filter((order) => order.status === 'confirmed').length;
    const cancelled = orders.filter((order) => order.status === 'cancelled').length;

    return { total: orders.length, upcoming, completed, cancelled };
  }, [orders]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 py-10">
        <header className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-accent uppercase tracking-[0.35em]">My Culinary Journeys</p>
            <h1 className="text-4xl font-semibold text-white">Track upcoming experiences & relive past tastings</h1>
            <p className="text-sm text-muted max-w-2xl">
              Every booking reflects a curated milestone. Manage confirmations, share updates with your chef, and keep tabs on special requests in one place.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-surface-elevated soft-border px-5 py-4">
              <p className="text-xs text-muted uppercase tracking-[0.4em]">Total</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.total}</p>
            </div>
            <div className="rounded-2xl bg-surface-elevated soft-border px-5 py-4">
              <p className="text-xs text-muted uppercase tracking-[0.4em]">Upcoming</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.upcoming}</p>
            </div>
            <div className="rounded-2xl bg-surface-elevated soft-border px-5 py-4">
              <p className="text-xs text-muted uppercase tracking-[0.4em]">Confirmed</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.completed}</p>
            </div>
            <div className="rounded-2xl bg-surface-elevated soft-border px-5 py-4">
              <p className="text-xs text-muted uppercase tracking-[0.4em]">Cancelled</p>
              <p className="mt-2 text-2xl font-semibold text-white">{stats.cancelled}</p>
            </div>
          </div>
        </header>

        {orders.length === 0 ? (
          <div className="rounded-3xl bg-surface-elevated soft-border px-8 py-16 text-center text-muted">
            <p className="text-lg font-semibold text-white mb-4">No culinary journeys yet</p>
            <p className="text-sm max-w-md mx-auto mb-6">
              Once you reserve a chef, well track every stepfrom menu design to the final toast.
            </p>
            <Link
              href="/meals"
              className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white shadow-glow hover:bg-accent-strong"
            >
              Find inspiration
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} mealName={meals[order.meal as any]?.name} />
            ))}
          </div>
        )}
      </main>

      <ChatAssistantFab />
      <BottomDock />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPageContent />
    </ProtectedRoute>
  );
}
