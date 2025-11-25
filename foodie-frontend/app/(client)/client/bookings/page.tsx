'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getBookings } from '@/lib/api/bookings';
import type { Booking } from '@/lib/api';
import CalendarWidget, { type CalendarEvent } from '@/components/CalendarWidget';
import { Calendar, MapPin, Users, Clock, CheckCircle, XCircle, AlertCircle, ChefHat } from 'lucide-react';

export default function ClientBookingsPage() {
  const router = useRouter();
  const { isAuthenticated, loading, user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
      return;
    }

    // Role check removed to prevent incorrect redirects
    if (user && user.role !== 'client') {
      console.warn('User accessing client bookings with role:', user.role);
      // We don't redirect here because it was causing issues for valid clients
      // and /chef/bookings might not exist.
    }

    if (isAuthenticated) {
      loadBookings();
    }
  }, [loading, isAuthenticated, user, router]);

  const loadBookings = async () => {
    try {
      setBookingsLoading(true);
      const response = await getBookings();
      if (response.data) {
        // Handle potential pagination or direct array response
        const bookingsData = Array.isArray(response.data)
          ? response.data
          : (response.data as any).results || [];

        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } else if (response.error) {
        setError(response.error);
        setBookings([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
      setBookings([]);
    } finally {
      setBookingsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/40 text-green-200 border-green-500/50';
      case 'confirmed':
      case 'in_progress':
        return 'bg-blue-900/40 text-blue-200 border-blue-500/50';
      case 'cancelled':
        return 'bg-red-900/40 text-red-200 border-red-500/50';
      case 'pending':
        return 'bg-yellow-900/40 text-yellow-200 border-yellow-500/50';
      default:
        return 'bg-gray-900/40 text-gray-200 border-gray-500/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(b.booking_date);
    return bookingDate >= new Date() && b.status !== 'cancelled' && b.status !== 'completed';
  });

  const pastBookings = bookings.filter(b => {
    const bookingDate = new Date(b.booking_date);
    return bookingDate < new Date() || b.status === 'cancelled' || b.status === 'completed';
  });

  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

  const calendarEvents: CalendarEvent[] = bookings
    .filter(b => b.status !== 'cancelled')
    .map(b => ({
      id: b.id,
      title: typeof b.chef === 'object' ? `Booking with ${b.chef.user.full_name}` : 'Booking',
      date: new Date(b.booking_date),
      type: 'booking',
      description: b.service_type.replace('_', ' '),
      startTime: new Date(b.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  if (loading || bookingsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-white/5 rounded-lg w-3/4" />
          <div className="h-10 bg-white/5 rounded-lg w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-4xl font-bold text-white">My Calendar</h1>
        <p className="text-white/70 text-lg">
          Track your upcoming culinary experiences
        </p>
      </header>

      {/* Error State */}
      {error && (
        <div className="rounded-2xl bg-red-900/40 border border-red-500/50 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-surface-elevated border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="h-16 w-16 sm:h-32 sm:w-32 text-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <h3 className="text-sm sm:text-lg font-medium text-white/70">Upcoming</h3>
              <div className="p-1.5 sm:p-2 rounded-full bg-white/5">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
              </div>
            </div>
            <p className="text-2xl sm:text-5xl font-bold text-white mb-1 sm:mb-2">{upcomingBookings.length}</p>
            <p className="text-xs sm:text-sm text-white/50">Scheduled events</p>
          </div>
        </div>

        <div className="bg-surface-elevated border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle className="h-16 w-16 sm:h-32 sm:w-32 text-white" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 sm:mb-8">
              <h3 className="text-sm sm:text-lg font-medium text-white/70">Confirmed</h3>
              <div className="p-1.5 sm:p-2 rounded-full bg-white/5">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
              </div>
            </div>
            <p className="text-2xl sm:text-5xl font-bold text-white mb-1 sm:mb-2">{confirmedBookings.length}</p>
            <p className="text-xs sm:text-sm text-white/50">Ready to go</p>
          </div>
        </div>
      </div>

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

      {/* Calendar and Bookings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <h3 className="text-lg font-medium text-white/70 mb-4 px-1">Calendar</h3>
            <CalendarWidget events={calendarEvents} />
          </div>
        </div>

        {/* Bookings List */}
        <div className="lg:col-span-2 space-y-4">
          {displayBookings.length === 0 ? (
            <div className="bg-surface-elevated border border-white/5 rounded-3xl p-12 text-center">
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
                  onClick={() => router.push('/client/discover')}
                  className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-white font-semibold hover:bg-accent-strong transition shadow-lg shadow-accent/20"
                >
                  Discover Chefs
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {displayBookings.map((booking) => {
                const bookingDate = new Date(booking.booking_date);
                return (
                  <div
                    key={booking.id}
                    className="bg-surface-elevated border border-white/5 rounded-3xl p-6 space-y-6 hover:border-white/10 transition-all group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className="h-10 w-10 sm:h-full sm:w-full bg-surface-highlight flex items-center justify-center text-muted rounded-full sm:rounded-none">
                          <ChefHat className="h-5 w-5 sm:h-8 sm:w-8" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-white">
                            {typeof booking.chef === 'object' && booking.chef?.user?.full_name
                              ? booking.chef.user.full_name
                              : 'Chef'}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${getStatusColor(
                                booking.status
                              )}`}
                            >
                              {getStatusIcon(booking.status)}
                              {booking.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {booking.confirmation_code && (
                              <span className="text-[10px] sm:text-xs text-white/40 font-mono">
                                #{booking.confirmation_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:block sm:text-right pl-14 sm:pl-0">
                        <p className="text-xs text-white/40 sm:hidden">Total</p>
                        <div>
                          <p className="text-lg sm:text-xl font-bold text-white">
                            KES {booking.total_amount?.toFixed(2) || booking.base_price?.toFixed(2) || '0.00'}
                          </p>
                          <p className="hidden sm:block text-xs text-white/40 mt-1">Total amount</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-black/20 rounded-2xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5">
                          <Calendar className="h-4 w-4 mr-2 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Date & Time</p>
                          <p className="font-medium text-white text-sm">
                            {bookingDate.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                            <span className="mx-1.5 text-white/20">|</span>
                            {bookingDate.toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/5">
                          <Users className="h-5 w-5 text-accent" />
                        </div>
                        <div>
                          <p className="text-xs text-white/40 uppercase tracking-wider font-medium">Details</p>
                          <p className="font-medium text-white text-sm">
                            {booking.number_of_guests} Guests
                            <span className="mx-1.5 text-white/20">|</span>
                            {booking.duration_hours} hrs
                          </p>
                        </div>
                      </div>
                    </div>

                    {booking.special_requests && (
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-sm text-white/60 leading-relaxed">
                          <span className="text-accent font-medium mr-2">Note:</span>
                          {booking.special_requests}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
