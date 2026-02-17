'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useClientBookings } from '@/hooks/useClientBookings';
import { 
    Calendar, 
    MapPin, 
    Users, 
    Clock, 
    CheckCircle, 
    XCircle, 
    AlertCircle, 
    ChefHat, 
    Info,
    Utensils,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';

export default function ClientBookingsPage() {
  const router = useRouter();
  const { bookings, loading, error, fetchBookings, cancelBooking } = useClientBookings();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-900/40 text-emerald-200 border-emerald-500/50';
      case 'confirmed':
      case 'in_progress':
        return 'bg-blue-900/40 text-blue-200 border-blue-500/50';
      case 'canceled':
        return 'bg-red-900/40 text-red-200 border-red-500/50';
      case 'pending':
        return 'bg-amber-900/40 text-amber-200 border-amber-500/50';
      default:
        return 'bg-gray-900/40 text-gray-200 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'canceled':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleCancelBooking = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this booking request?')) return;
    setCancellingId(id);
    const ok = await cancelBooking(id);
    setCancellingId(null);
    if (ok) showToast('Booking canceled', 'success');
    else showToast('Failed to cancel booking', 'error');
  };

  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date_time);
    const now = new Date();
    return bookingDate >= now && b.status !== 'canceled' && b.status !== 'completed';
  });

  const pastBookings = bookings.filter(b => {
    const bookingDate = new Date(b.date_time);
    const now = new Date();
    return bookingDate < now || b.status === 'canceled' || b.status === 'completed';
  });

  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 max-w-5xl mx-auto px-4 pt-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white">My Calendar</h1>
        <p className="text-white/70 text-lg">
          Track your culinary experiences and status updates.
        </p>
      </header>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl bg-red-900/40 border border-red-500/50 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeTab === 'upcoming'
            ? 'bg-white/10 text-white border border-white/10'
            : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
        >
          Upcoming ({upcomingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${activeTab === 'past'
            ? 'bg-white/10 text-white border border-white/10'
            : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
        >
          Past ({pastBookings.length})
        </button>
      </div>

      <div className="space-y-6">
          {displayBookings.length === 0 ? (
            <div className="bg-white/5 border border-white/5 rounded-3xl p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-white/30" />
              </div>
              <p className="text-white/70 mb-2 text-lg">No {activeTab} bookings</p>
              <p className="text-sm text-white/50 mb-6">
                {activeTab === 'upcoming'
                  ? "You don't have any upcoming culinary experiences scheduled."
                  : "You haven't completed any bookings yet."}
              </p>
              {activeTab === 'upcoming' && (
                <button
                  onClick={() => router.push('/')}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-white font-semibold hover:bg-orange-500 transition shadow-lg shadow-accent/20"
                >
                  Explore Experiences
                </button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1">
              {displayBookings.map((booking) => {
                const bookingDate = new Date(booking.date_time);
                return (
                  <div
                    key={booking.id}
                    className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 hover:border-accent/30 transition-all group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 relative rounded-2xl overflow-hidden shrink-0 border border-white/10 bg-[#1f2228]">
                           {booking.menu?.image_url ? (
                             <img 
                              src={booking.menu.image_url} 
                              alt={booking.menu?.name ?? 'Menu'} 
                              className="object-cover w-full h-full"
                             />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-white/20">
                               <ChefHat className="h-8 w-8" />
                             </div>
                           )}
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-accent tracking-widest mb-1">{booking.experience?.name}</p>
                          <h3 className="text-xl font-bold text-white leading-tight">
                            {booking.menu?.name ?? 'Reserved Experience'}
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {getStatusIcon(booking.status)}
                              {booking.status.toUpperCase()}
                            </span>
                            <span className="text-[10px] text-white/40 font-mono">
                              #{booking.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:flex-col md:items-end gap-1 px-4 md:px-0 bg-white/5 md:bg-transparent py-3 md:py-0 rounded-2xl">
                        <p className="text-xs text-white/40 uppercase font-bold tracking-tighter md:hidden">Total Price</p>
                        <div className="text-right">
                          <p className="text-2xl font-black text-white">
                            KES {booking.total_price.toLocaleString()}
                          </p>
                          <p className="hidden md:block text-[10px] text-white/40 font-bold uppercase tracking-widest">Amount Payable</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                        <Calendar className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Date & Time</p>
                          <p className="font-semibold text-white text-sm">
                            {bookingDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })} @ {bookingDate.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-black/20 rounded-2xl border border-white/5">
                        <Users className="h-5 w-5 text-accent" />
                        <div>
                          <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Party Size</p>
                          <p className="font-semibold text-white text-sm">{booking.guests_count} Guests</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10 sm:col-span-2 lg:col-span-1">
                        <MapPin className="h-5 w-5 text-accent" />
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Location</p>
                          <p className="font-semibold text-white text-sm truncate" title={booking.address}>{booking.address}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5">
                        {booking.status === 'pending' && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleCancelBooking(booking.id)}
                                disabled={cancellingId === booking.id}
                                className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl"
                            >
                                {cancellingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                                Cancel Request
                            </Button>
                        )}
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            asChild
                            className="bg-white/5 text-white hover:bg-white/10 border-white/10 rounded-xl"
                        >
                            <Link href={`/experiences/${booking.experience_id}`}>
                                <Info className="h-4 w-4 mr-2" /> View Experience Details
                            </Link>
                        </Button>
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
