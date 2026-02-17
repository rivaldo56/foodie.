'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Calendar, MapPin, Users, Clock, Home } from 'lucide-react';

type Booking = {
  id: string;
  created_at: string;
  date_time: string;
  guests_count: number;
  total_price: number;
  status: string;
  address: string;
  menu: {
    name: string;
    experience: {
        name: string;
    }
  }
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function fetchBookings() {
       const { data: { user } } = await supabase.auth.getUser();
       setUser(user);

       if (user) {
         const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                menu:menus (
                    name,
                    experience:experiences (
                        name
                    )
                )
            `)
            .eq('client_id', user.id)
            .order('created_at', { ascending: false });
            
         if (error) {
            console.error('Error fetching bookings:', error);
         } else {
            setBookings(data as any || []);
         }
       }
       setLoading(false);
    }

    fetchBookings();
  }, []);

  if (loading) {
     return (
        <div className="flex h-screen items-center justify-center bg-[#0f0c0a] text-white">
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
                <h1 className="text-3xl font-bold">My Bookings</h1>
                <Link href="/" className="inline-flex items-center gap-2 text-sm text-accent hover:text-accent-strong transition-colors">
                    <Home className="h-4 w-4" /> Back to Home
                </Link>
            </div>

            {bookings.length === 0 ? (
                <Card className="bg-white/5 border-white/10 text-white">
                    <CardContent className="flex flex-col items-center justify-center py-16 space-y-4">
                        <Calendar className="h-12 w-12 text-white/20" />
                        <p className="text-xl font-semibold">No bookings yet</p>
                        <p className="text-white/60">Explore our curated experiences to make your first booking.</p>
                        <Link href="/" className="mt-4 inline-flex items-center justify-center rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-white/90">
                            Explore Experiences
                        </Link>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking) => (
                        <Card key={booking.id} className="bg-white/5 border-white/10 text-white overflow-hidden">
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-4 md:items-start">
                                    <div className="space-y-1">
                                         <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide
                                                ${booking.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                                                  booking.status === 'confirmed' ? 'bg-green-500/20 text-green-500' :
                                                  booking.status === 'completed' ? 'bg-blue-500/20 text-blue-500' :
                                                  'bg-red-500/20 text-red-500'}
                                            `}>
                                                {booking.status}
                                            </span>
                                            <span className="text-xs text-white/40">#{booking.id.slice(0, 8)}</span>
                                         </div>
                                         <h3 className="text-xl font-bold">{booking.menu?.name || 'Unknown Menu'}</h3>
                                         <p className="text-white/60 text-sm">Experience: {booking.menu?.experience?.name || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-accent">KES {booking.total_price.toLocaleString()}</p>
                                        <p className="text-xs text-white/50">{booking.guests_count} Guests</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/10">
                                    <div className="flex items-center gap-3 text-sm text-white/80">
                                        <Calendar className="h-4 w-4 text-accent" />
                                        <span>{new Date(booking.date_time).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-white/80">
                                        <Clock className="h-4 w-4 text-accent" />
                                        <span>{new Date(booking.date_time).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-white/80 md:col-span-2">
                                        <MapPin className="h-4 w-4 text-accent" />
                                        <span className="truncate">{booking.address}</span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    </div>
  );
}
