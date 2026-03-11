'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  CheckCircle2, Calendar, MapPin, Users, Clock,
  CreditCard, ChevronRight, Loader2, Home, ShieldCheck
} from 'lucide-react';

type ConfirmationData = {
  id: string;
  date_time: string;
  address: string;
  guests_count: number;
  total_price: number;
  deposit_amount: number | null;
  payment_model: string;
  status: string;
  menu: { name: string; experience: { name: string } | null } | null;
  escrow: { deposit_amount: number; remaining_amount: number; escrow_status: string } | null;
};

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const [data, setData] = useState<ConfirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) { setError('No booking ID provided'); setLoading(false); return; }

    async function fetchConfirmation() {
      const { data: booking, error: bookingErr } = await supabase
        .from('bookings')
        .select(`
          id, date_time, address, guests_count, total_price,
          deposit_amount, payment_model, status,
          menu:menus ( name, experience:experiences ( name ) )
        `)
        .eq('id', bookingId as string)
        .single();

      if (bookingErr || !booking) { setError('Booking not found'); setLoading(false); return; }

      const { data: escrow } = await supabase
        .from('escrow_transactions')
        .select('deposit_amount, remaining_amount, escrow_status')
        .eq('booking_id', bookingId as string)
        .single();

      setData({ ...booking, escrow } as any);
      setLoading(false);
    }
    fetchConfirmation();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0c0a]">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0c0a] text-white gap-4">
        <p className="text-red-400">{error || 'Something went wrong'}</p>
        <Link href="/bookings" className="text-accent hover:underline">View all bookings</Link>
      </div>
    );
  }

  const depositAmount = data.escrow?.deposit_amount ?? (data.total_price * 0.30);
  const remainingAmount = data.escrow?.remaining_amount ?? (data.total_price * 0.70);

  return (
    <div className="min-h-screen bg-[#0f0c0a] text-white flex items-start justify-center pt-16 px-4 pb-20">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-3">
          <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold">Booking Confirmed!</h1>
          <p className="text-white/60">Your chef has accepted. Here are your booking details.</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/10">
            <p className="text-xs text-white/40 mb-1">Menu</p>
            <p className="font-bold text-lg">{data.menu?.name ?? 'Custom Booking'}</p>
            <p className="text-sm text-white/50">{(data.menu?.experience as any)?.name}</p>
          </div>
          <div className="p-6 space-y-4">
            {[
              { icon: <Calendar className="h-4 w-4" />, label: new Date(data.date_time).toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
              { icon: <Clock className="h-4 w-4" />, label: new Date(data.date_time).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) },
              { icon: <Users className="h-4 w-4" />, label: `${data.guests_count} Guests` },
              { icon: <MapPin className="h-4 w-4" />, label: data.address },
            ].map(({ icon, label }, i) => (
              <div key={i} className="flex items-start gap-3 text-sm text-white/70">
                <span className="text-accent mt-0.5 flex-shrink-0">{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h2 className="font-bold">Payment & Escrow</h2>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-white/60">Total Event Price</p>
              <p className="text-sm font-bold text-white">KES {data.total_price.toLocaleString()}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-white/60">Deposit Paid (30%)</p>
              <p className="text-sm font-bold text-accent">KES {depositAmount.toLocaleString()}</p>
            </div>
            <div className="pt-2 border-t border-white/10">
              {data.payment_model === 'cash_balance' ? (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-white/60">Cash Balance (Event Day)</p>
                    <p className="text-xs text-white/30 mt-0.5">Collected by your chef</p>
                  </div>
                  <p className="text-sm font-bold text-white">KES {remainingAmount.toLocaleString()}</p>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-white/60">Auto-charged 48h Before Event</p>
                    <p className="text-xs text-white/30 mt-0.5">Via same payment method</p>
                  </div>
                  <p className="text-sm font-bold text-white">KES {remainingAmount.toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-xs text-white/50">
            💳 Your deposit is held securely in escrow and only released after your event is completed.
          </div>
        </div>

        <div className="text-center text-xs text-white/30 font-mono">
          Booking #{data.id.slice(0, 12).toUpperCase()}
        </div>

        <div className="flex gap-3">
          <Link href="/bookings" className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-white/10 py-4 text-sm font-semibold text-white hover:bg-white/5 transition">
            <ChevronRight className="h-4 w-4 rotate-180" /> My Bookings
          </Link>
          <Link href="/" className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 text-sm font-bold text-white hover:bg-accent/90 transition">
            <Home className="h-4 w-4" /> Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
