import Link from 'next/link';
import { Order } from '@/lib/api';
import { CalendarClock, MessageCircle, User2 } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  mealName?: string;
}

const STATUS_COPY: Record<Order['status'], { badge: string; tone: string; label: string }> = {
  pending: { badge: 'bg-warning/20 text-warning', tone: 'Preparing your experience', label: 'Pending Confirmation' },
  confirmed: { badge: 'bg-success/20 text-success', tone: 'Chef confirmed · Get ready!', label: 'Confirmed' },
  cancelled: { badge: 'bg-danger/20 text-danger', tone: 'Cancelled · You can rebook anytime', label: 'Cancelled' },
};

export default function OrderCard({ order, mealName }: OrderCardProps) {
  const scheduledDate = order.scheduled_at ? new Date(order.scheduled_at) : null;
  const status = STATUS_COPY[order.status] ?? STATUS_COPY.pending;
  const total = order.total ?? order.total_amount ?? 0;

  return (
    <article className="rounded-3xl bg-surface-elevated soft-border px-6 py-6 shadow-glow">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-muted">Order #{order.id.toString().padStart(4, '0')}</p>
          <h3 className="text-lg font-semibold text-white">{mealName || 'Custom Tasting Menu'}</h3>
          <p className="text-xs text-muted mt-1">Placed {new Date(order.created_at).toLocaleDateString()}</p>
        </div>

        <div className="inline-flex flex-col items-end gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.badge}`}>{status.label}</span>
          <span className="text-[11px] text-muted">{status.tone}</span>
        </div>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-surface-highlight px-4 py-3">
          <p className="text-xs text-muted">Total Investment</p>
          <p className="text-lg font-semibold text-accent">KSh {total.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl bg-surface-highlight px-4 py-3">
          <p className="text-xs text-muted inline-flex items-center gap-2">
            <CalendarClock className="h-4 w-4" />
            Scheduled
          </p>
          <p className="text-sm font-medium text-white mt-1">
            {scheduledDate ? scheduledDate.toLocaleString() : 'Awaiting confirmation'}
          </p>
        </div>
        <div className="rounded-2xl bg-surface-highlight px-4 py-3">
          <p className="text-xs text-muted inline-flex items-center gap-2">
            <User2 className="h-4 w-4" />
            Guests
          </p>
          <p className="text-sm font-medium text-white mt-1">{order.guest_count ?? '—'}</p>
        </div>
        <div className="rounded-2xl bg-surface-highlight px-4 py-3 text-sm text-muted line-clamp-3">
          {order.special_requests || 'No special requests submitted yet.'}
        </div>
      </div>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/orders/${order.id}`} className="text-sm font-semibold text-accent hover:text-accent-strong">
          View order timeline →
        </Link>
        <button className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white shadow-glow hover:bg-accent-strong transition">
          <MessageCircle className="h-4 w-4" />
          Message chef
        </button>
      </footer>
    </article>
  );
}
