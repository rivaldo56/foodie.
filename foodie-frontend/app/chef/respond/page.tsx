'use client';
import { Suspense } from 'react';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Loader2, ChefHat, CheckCircle2, XCircle, Clock,
  Calendar, MapPin, Users, Star, AlertTriangle, Banknote,
} from 'lucide-react';

type BookingDetails = {
  id: string;
  date_time: string;
  address: string;
  guests_count: number;
  total_amount: number | null;
  total_price: number;
  prep_advance_amount: number | null;
  final_payout_amount: number | null;
  status: string;
  expires_at: string | null;   // from dispatch_attempts
};

function CountdownTimer({ expiresAt }: { expiresAt: string }) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(diff);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const mins = Math.floor(secondsLeft / 60).toString().padStart(2, '0');
  const secs = (secondsLeft % 60).toString().padStart(2, '0');
  const isUrgent = secondsLeft < 120;

  return (
    <div className={`flex items-center gap-2 text-sm font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-amber-400'}`}>
      <Clock className="h-4 w-4" />
      <span>{mins}:{secs}</span>
      <span className="font-sans font-normal text-white/40">remaining to respond</span>
    </div>
  );
}

function ChefRespondPageContent() {
  const params    = useSearchParams();
  const router    = useRouter();
  const bookingId = params.get('booking_id');
  const preselectedResponse = params.get('response') as 'accepted' | 'declined' | null;

  const [booking,     setBooking]     = useState<BookingDetails | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState<'accepted' | 'declined' | null>(null);
  const [result,      setResult]      = useState<'accepted' | 'declined' | 'expired' | 'error' | null>(null);
  const [expiresAt,   setExpiresAt]   = useState<string | null>(null);
  const [error,       setError]       = useState<string | null>(null);

  const fetchBookingDetails = useCallback(async () => {
    if (!bookingId) { setError('No booking ID provided'); setLoading(false); return; }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/chef/respond?booking_id=${bookingId}&response=${preselectedResponse}`);
      return;
    }

    // Fetch booking details
    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select(`
        id, date_time, address, guests_count,
        total_amount, total_price, prep_advance_amount,
        final_payout_amount, status
      `)
      .eq('id', bookingId)
      .single();

    if (fetchErr || !booking) {
      setError('Booking not found or expired');
      setLoading(false);
      return;
    }

    // Fetch active dispatch attempt for expiry time
    const { data: attempt } = await supabase
      .from('dispatch_attempts')
      .select('expires_at, status')
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .order('attempt_num', { ascending: false })
      .limit(1)
      .single();

    if (!attempt || attempt.status !== 'pending') {
      // Booking already assigned to someone else
      setResult('expired');
      setLoading(false);
      return;
    }

    if (new Date(attempt.expires_at) < new Date()) {
      setResult('expired');
      setLoading(false);
      return;
    }

    setBooking(booking as BookingDetails);
    setExpiresAt(attempt.expires_at);
    setLoading(false);
  }, [bookingId, preselectedResponse, router]);

  useEffect(() => { fetchBookingDetails(); }, [fetchBookingDetails]);

  const handleRespond = async (response: 'accepted' | 'declined') => {
    setSubmitting(response);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/chef-respond`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            booking_id: bookingId,
            response,
            chef_user_id: session.user.id,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      setResult(response);
    } catch (err: any) {
      console.error('[chef-respond page]', err);
      setError(err.message);
    } finally {
      setSubmitting(null);
    }
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0c0a]">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0c0a] text-white gap-4 px-4">
        <AlertTriangle className="h-12 w-12 text-red-400" />
        <p className="text-xl font-semibold text-center">{error}</p>
        <button onClick={() => router.push('/')} className="rounded-full bg-accent px-8 py-3 font-semibold text-white">
          Go Home
        </button>
      </div>
    );
  }

  // ─── Expired ───────────────────────────────────────────────────────────────
  if (result === 'expired') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0c0a] text-white gap-6 px-4">
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/5 p-10 max-w-md text-center">
          <Clock className="h-14 w-14 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Response Window Expired</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            This booking has been assigned to another chef. Keep an eye on new requests!
          </p>
        </div>
      </div>
    );
  }

  // ─── Accepted ──────────────────────────────────────────────────────────────
  if (result === 'accepted') {
    const totalAmount = booking?.total_amount ?? booking?.total_price ?? 0;
    const prepAdvance = booking?.prep_advance_amount ?? totalAmount * 0.25;
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0c0a] text-white gap-6 px-4">
        <div className="rounded-3xl border border-accent/30 bg-accent/5 p-10 max-w-md text-center">
          <CheckCircle2 className="h-14 w-14 text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Booking Accepted! 🎉</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            You're confirmed. A prep advance of{' '}
            <span className="text-accent font-bold">KES {prepAdvance.toLocaleString()}</span>{' '}
            is on its way to your M-Pesa.
          </p>
          <button onClick={() => router.push('/')} className="mt-6 rounded-full bg-accent px-8 py-3 font-semibold text-white w-full">
            View My Jobs
          </button>
        </div>
      </div>
    );
  }

  // ─── Declined ──────────────────────────────────────────────────────────────
  if (result === 'declined') {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0c0a] text-white gap-6 px-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-10 max-w-md text-center">
          <XCircle className="h-14 w-14 text-white/40 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Booking Declined</h2>
          <p className="text-white/60 text-sm leading-relaxed">
            No problem — we've notified another chef. Look out for new requests!
          </p>
        </div>
      </div>
    );
  }

  // ─── Main respond view ─────────────────────────────────────────────────────
  const totalAmount = booking?.total_amount ?? booking?.total_price ?? 0;
  const prepAdvance = booking?.prep_advance_amount ?? totalAmount * 0.25;
  const finalPayout = booking?.final_payout_amount ?? totalAmount * 0.60;

  return (
    <div className="min-h-screen bg-[#0f0c0a] text-white px-4 py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 mb-4">
            <ChefHat className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-2xl font-bold">New Booking Request</h1>
          <p className="text-white/50 text-sm mt-1">Review the details and respond below</p>
        </div>

        {/* Countdown */}
        {expiresAt && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-5 py-3 mb-6 flex justify-center">
            <CountdownTimer expiresAt={expiresAt} />
          </div>
        )}

        {/* Booking details card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-accent flex-shrink-0" />
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide">Event Date & Time</p>
              <p className="font-semibold">
                {booking?.date_time
                  ? new Date(booking.date_time).toLocaleDateString('en-KE', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                    })
                  : '—'}
                {' · '}
                {booking?.date_time
                  ? new Date(booking.date_time).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
                  : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-accent flex-shrink-0" />
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide">Location</p>
              <p className="font-semibold">{booking?.address ?? '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-accent flex-shrink-0" />
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wide">Guests</p>
              <p className="font-semibold">{booking?.guests_count ?? '—'} people</p>
            </div>
          </div>
        </div>

        {/* Earnings breakdown */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 mb-8">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
            <Banknote className="h-4 w-4" /> Your Earnings
          </p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Booking Value</span>
              <span className="font-bold">KES {totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Prep Advance (sent on accept)</span>
              <span className="font-semibold text-amber-400">KES {prepAdvance.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Final Payout (after event)</span>
              <span className="font-semibold text-emerald-400">KES {finalPayout.toLocaleString()}</span>
            </div>
            <div className="border-t border-white/10 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold">Total Earnings</span>
              <span className="text-xl font-bold text-accent">
                KES {(prepAdvance + finalPayout).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="btn-decline"
            onClick={() => handleRespond('declined')}
            disabled={!!submitting}
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-white/20 py-4 font-semibold text-white/70 hover:bg-white/5 transition disabled:opacity-50 text-sm"
          >
            {submitting === 'declined'
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : <XCircle className="h-5 w-5" />}
            Decline
          </button>
          <button
            id="btn-accept"
            onClick={() => handleRespond('accepted')}
            disabled={!!submitting}
            className="flex-[2] flex items-center justify-center gap-2 rounded-2xl bg-accent py-4 font-bold text-white hover:bg-accent/90 transition disabled:opacity-50 text-sm"
          >
            {submitting === 'accepted'
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : <CheckCircle2 className="h-5 w-5" />}
            Accept Booking
          </button>
        </div>
      </div>
    </div>
  );
}




export default function ChefRespondPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>}>
      <ChefRespondPageContent />
    </Suspense>
  );
}
