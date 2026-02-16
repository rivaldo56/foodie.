'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Calendar, Home, Loader2, Info, Users, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function ConfirmationInner() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooking() {
      if (!bookingId) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          menu:menus (
            name,
            base_price,
            price_per_person
          ),
          experience:experiences (
            name
          )
        `)
        .eq('id', bookingId)
        .single();

      if (!error && data) {
        setBooking(data);
      }
      setLoading(false);
    }

    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0c0a] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0c0a] text-white flex items-center justify-center px-4 py-20">
      <Card className="bg-white/5 border-white/10 max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <CardContent className="p-0 text-center">
          <div className="p-8 sm:p-10 space-y-6">
            <div className="flex justify-center">
              <div className="h-20 w-20 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-glow shadow-emerald-500/20">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </div>
            </div>
            
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">Booking Requested!</h1>
              <p className="text-white/70 mt-3 text-sm leading-relaxed max-w-xs mx-auto">
                We&apos;ve sent your request to the chef. You&apos;ll be notified as soon as it&apos;s confirmed.
              </p>
              {bookingId && (
                <div className="mt-4 inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10">
                    <p className="text-white/40 text-[10px] font-mono uppercase tracking-widest">Reference No. #{bookingId.slice(0, 8)}</p>
                </div>
              )}
            </div>

            {booking && (
              <div className="bg-black/20 rounded-3xl p-6 text-left border border-white/5 space-y-6">
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                    <div>
                        <p className="text-[10px] text-accent font-bold uppercase tracking-widest">{booking.experience?.name}</p>
                        <h3 className="text-lg font-bold text-white">{booking.menu?.name}</h3>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white/40">
                            <Calendar size={14} />
                            <span className="text-[10px] font-bold uppercase">Date</span>
                        </div>
                        <p className="text-sm font-semibold">{new Date(booking.date_time).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white/40">
                            <Clock size={14} />
                            <span className="text-[10px] font-bold uppercase">Time</span>
                        </div>
                        <p className="text-sm font-semibold">{new Date(booking.date_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white/40">
                            <Users size={14} />
                            <span className="text-[10px] font-bold uppercase">Guests</span>
                        </div>
                        <p className="text-sm font-semibold">{booking.guests_count} People</p>
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-white/40">
                            <MapPin size={14} />
                            <span className="text-[10px] font-bold uppercase">Location</span>
                        </div>
                        <p className="text-sm font-semibold truncate" title={booking.address}>{booking.address.split(',')[0]}</p>
                    </div>
                </div>

                <div className="pt-4 border-t border-white/10">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-white/50">Base Price</span>
                        <span className="text-xs font-medium">KES {Number(booking.menu?.base_price || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs text-white/50">Guests ({booking.guests_count} × KES {Number(booking.menu?.price_per_person || 0).toLocaleString()})</span>
                        <span className="text-xs font-medium">KES {(booking.guests_count * Number(booking.menu?.price_per_person || 0)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-white/5">
                        <span className="text-sm font-bold text-white/80">Total Amount</span>
                        <span className="text-xl font-black text-accent">KES {Number(booking.total_price).toLocaleString()}</span>
                    </div>
                </div>
              </div>
            )}
            
            <div className="bg-amber-500/10 rounded-2xl p-4 flex items-start gap-3 text-left">
                <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/80 leading-relaxed">
                    No payment is required right now. Once the chef accepts, we&apos;ll send you a link to complete your reservation.
                </p>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button asChild className="h-12 bg-accent hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg shadow-accent/20">
                <Link href="/client/bookings" className="inline-flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  View in My Calendar
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 border-white/10 text-white/70 hover:bg-white/5 hover:text-white rounded-xl">
                <Link href="/" className="inline-flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Continue Browsing
                </Link>
              </Button>
            </div>
          </div>
          <div className="bg-white/5 p-4 border-t border-white/10">
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Foodie Premium Marketplace</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#0f0c0a] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    }>
      <ConfirmationInner />
    </Suspense>
  );
}
