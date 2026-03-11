'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Loader2, Calendar, MapPin, Users, Clock, Home,
  ShieldCheck, CheckCircle2, RotateCcw, AlertTriangle, Banknote
} from 'lucide-react';

type Booking = {
  id: string;
  created_at: string;
  date_time: string;
  guests_count: number;
  total_price: number;
  deposit_amount: number | null;
  status: string;
  escrow_status: string;
  payment_model: string;
  address: string;
  menu: { name: string; experience: { name: string } | null } | null;
};

// V3 status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  rotating:                   { label: 'Finding Chef',     color: 'bg-amber-500/20 text-amber-400',    icon: <RotateCcw className="h-3 w-3 animate-spin" /> },
  assigned:                   { label: 'Chef Assigned',    color: 'bg-blue-500/20 text-blue-400',       icon: null },
  pending:                    { label: 'Pending',          color: 'bg-yellow-500/20 text-yellow-400',   icon: null },
  confirmed:                  { label: 'Confirmed',        color: 'bg-emerald-500/20 text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" /> },
  in_progress:                { label: 'In Progress',      color: 'bg-indigo-500/20 text-indigo-400',   icon: null },
  completed:                  { label: 'Completed',        color: 'bg-blue-500/20 text-blue-400',       icon: null },
  awaiting_client_confirmation: { label: 'Confirm Event', color: 'bg-violet-500/20 text-violet-400',   icon: <AlertTriangle className="h-3 w-3" /> },
  payout_processing:          { label: 'Payout Processing',color: 'bg-teal-500/20 text-teal-400',      icon: null },
  paid_out:                   { label: 'Paid Out',         color: 'bg-emerald-500/20 text-emerald-400', icon: <CheckCircle2 className="h-3 w-3" /> },
  canceled:                   { label: 'Cancelled',        color: 'bg-red-500/20 text-red-400',         icon: null },
  disputed:                   { label: 'Disputed',         color: 'bg-orange-500/20 text-orange-400',   icon: <AlertTriangle className="h-3 w-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: 'bg-white/10 text-white/60', icon: null };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (!u) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, created_at, date_time, guests_count, total_price,
        deposit_amount, status, escrow_status, payment_model, address,
        menu:menus (
          name,
          experience:experiences ( name )
        )
      `)
      .eq('client_id', u.id)
      .order('created_at', { ascending: false });

    if (!error) setBookings((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleConfirmSatisfaction = async (bookingId: string) => {
    setConfirmingId(bookingId);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/confirm`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchBookings(); // Refresh list
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0c0a]">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0c0a] text-white space-y-4">
        <h1 className="text-2xl font-bold">Please Sign In</h1>
        <p className="text-white/60">You need to be logged in to view your bookings.</p>
        <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-accent px-8 py-3 font-semibold text-white">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0c0a] text-white pb-20 pt-10 px-4">
      <div className="max-w-4xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Bookings</h1>
            <p className="text-white/40 text-sm mt-1">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent/80 transition-colors">
            <Home className="h-4 w-4" /> Home
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 py-20 flex flex-col items-center gap-4">
            <Calendar className="h-12 w-12 text-white/20" />
            <p className="text-xl font-semibold">No bookings yet</p>
            <p className="text-white/50 text-sm">Explore our curated experiences to book your first event.</p>
            <Link href="/" className="mt-2 inline-flex items-center justify-center rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent/90">
              Explore Experiences
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const needsConfirm = ['completed', 'awaiting_client_confirmation'].includes(booking.status);
              const depositAmount = booking.deposit_amount ?? booking.total_price * 0.30;

              return (
                <div key={booking.id}
                  className={`rounded-3xl border overflow-hidden transition-all duration-200
                    ${needsConfirm ? 'border-violet-500/40 bg-gradient-to-br from-violet-500/5 to-transparent' : 'border-white/10 bg-white/5'}`}>
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4 md:items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <StatusBadge status={booking.status} />
                          {booking.escrow_status && booking.escrow_status !== 'none' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/5 text-white/40 border border-white/10">
                              <ShieldCheck className="h-3 w-3" /> escrow: {booking.escrow_status}
                            </span>
                          )}
                          {booking.payment_model === 'cash_balance' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/5 text-white/40 border border-white/10">
                              <Banknote className="h-3 w-3" /> cash balance
                            </span>
                          )}
                          <span className="text-xs text-white/30">#{booking.id.slice(0, 8)}</span>
                        </div>
                        <h3 className="text-xl font-bold">{booking.menu?.name || 'Custom Booking'}</h3>
                        <p className="text-white/50 text-sm">{(booking.menu?.experience as any)?.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl font-bold text-accent">KES {booking.total_price.toLocaleString()}</p>
                        <p className="text-xs text-white/40">{booking.guests_count} Guests</p>
                        {booking.deposit_amount != null && (
                          <p className="text-xs text-white/40 mt-0.5">
                            Deposit: KES {depositAmount.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5 pt-5 border-t border-white/10">
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Calendar className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>{new Date(booking.date_time).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <Clock className="h-4 w-4 text-accent flex-shrink-0" />
                        <span>{new Date(booking.date_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-white/70 md:col-span-1">
                        <MapPin className="h-4 w-4 text-accent flex-shrink-0" />
                        <span className="truncate">{booking.address}</span>
                      </div>
                    </div>

                    {/* Confirm Satisfaction CTA */}
                    {needsConfirm && (
                      <div className="mt-5 pt-4 border-t border-violet-500/20">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
                          <div>
                            <p className="text-sm font-semibold text-violet-300">Event completed?</p>
                            <p className="text-xs text-white/40 mt-0.5">
                              Confirming satisfaction releases the escrow to your chef immediately.
                            </p>
                          </div>
                          <button
                            onClick={() => handleConfirmSatisfaction(booking.id)}
                            disabled={confirmingId === booking.id}
                            className="flex-shrink-0 flex items-center gap-2 rounded-xl bg-violet-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-400 transition disabled:opacity-50">
                            {confirmingId === booking.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <CheckCircle2 className="h-4 w-4" />}
                            Confirm Satisfaction
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
