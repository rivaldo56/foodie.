'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getChefAnalytics, getChefEvents, createChefEvent, type ChefEvent } from '@/lib/api';
import DashboardStats from '@/components/chef/DashboardStats';
import RevenueChart from '@/components/chef/RevenueChart';
import CalendarWidget, { type CalendarEvent } from '@/components/CalendarWidget';
import {
  DollarSign,
  Calendar,
  Star,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    total_revenue: number;
    month_revenue: number;
    week_revenue: number;
    daily_revenue: Array<{ date: string; revenue: number }>;
  };
  bookings: {
    total_bookings: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    month_bookings: number;
    upcoming_bookings: Array<{
      id: number;
      client_name: string;
      booking_date: string;
      service_type: string;
      number_of_guests: number;
      total_amount: number;
      status: string;
      confirmation_code: string;
    }>;
  };
  reviews: {
    average_rating: number;
    average_food_quality: number;
    average_professionalism: number;
    average_punctuality: number;
    total_reviews: number;
    rating_distribution: Record<string, number>;
    recent_reviews: Array<{
      id: number;
      client_name: string;
      rating: number;
      comment: string;
      created_at: string;
      food_quality: number;
      professionalism: number;
      punctuality: number;
    }>;
  };
  chef: {
    id: number;
    name: string;
    average_rating: number;
    total_bookings: number;
    is_verified: boolean;
  };
}

export default function ChefDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [events, setEvents] = useState<ChefEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calendar Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    async function fetchData() {
      if (!isAuthenticated) return;

      setIsLoading(true);
      setError(null);

      try {
        const [analyticsRes, eventsRes] = await Promise.all([
          getChefAnalytics(),
          getChefEvents()
        ]);

        if (analyticsRes.error) {
          setError(analyticsRes.error);
        } else if (analyticsRes.data) {
          setAnalytics(analyticsRes.data);
        }

        if (eventsRes.data) {
          setEvents(eventsRes.data);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isAuthenticated]);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEvent(true);

    // Set start time to selected date at 9 AM, end at 10 AM by default
    // In a real app, we'd add time pickers
    const startTime = new Date(selectedDate);
    startTime.setHours(9, 0, 0, 0);
    const endTime = new Date(selectedDate);
    endTime.setHours(10, 0, 0, 0);

    const response = await createChefEvent({
      title: newEventTitle,
      description: newEventDescription,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      is_all_day: false
    });

    if (response.data) {
      setEvents([...events, response.data]);
      setIsEventModalOpen(false);
      setNewEventTitle('');
      setNewEventDescription('');
    }
    setIsSubmittingEvent(false);
  };

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const statusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500/20 text-emerald-400';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'completed':
        return 'bg-blue-500/20 text-blue-400';
      case 'cancelled':
        return 'bg-red-500/20 text-red-400';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  // Combine bookings and personal events for the calendar
  const calendarEvents: CalendarEvent[] = [
    ...(analytics.bookings.upcoming_bookings.map(b => ({
      id: `booking-${b.id}`,
      title: `Booking: ${b.client_name}`,
      date: new Date(b.booking_date),
      type: 'booking' as const,
      description: `${b.service_type.replace('_', ' ')} for ${b.number_of_guests} guests`,
      startTime: new Date(b.booking_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }))),
    ...events.map(e => ({
      id: `event-${e.id}`,
      title: e.title,
      date: new Date(e.start_time),
      type: 'personal' as const,
      description: e.description,
      startTime: new Date(e.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }))
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2 sm:space-y-3">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] sm:tracking-[0.35em] text-orange-300/80">Dashboard Overview</p>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white">
          Welcome back, {analytics.chef.name}
        </h1>
        {analytics.chef.is_verified && (
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            <CheckCircle className="h-3 w-3" />
            Verified Chef
          </div>
        )}
      </header>

      {/* Quick Stats */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <DashboardStats
          title="Total Revenue"
          value={`KSh ${analytics.revenue.total_revenue.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle={`KSh ${analytics.revenue.month_revenue.toLocaleString()} this month`}
        />
        <DashboardStats
          title="Total Bookings"
          value={analytics.bookings.total_bookings}
          icon={<Calendar className="h-5 w-5" />}
          subtitle={`${analytics.bookings.month_bookings} this month`}
        />
        <DashboardStats
          title="Average Rating"
          value={analytics.reviews.average_rating.toFixed(1)}
          icon={<Star className="h-5 w-5" />}
          subtitle={`${analytics.reviews.total_reviews} reviews`}
        />
        <DashboardStats
          title="Pending Bookings"
          value={analytics.bookings.pending}
          icon={<AlertCircle className="h-5 w-5" />}
          subtitle={`${analytics.bookings.confirmed} confirmed`}
        />
      </div>

      {/* Revenue Chart */}
      <RevenueChart data={analytics.revenue.daily_revenue} />

      {/* Calendar and Upcoming Bookings Grid */}
      <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Calendar Widget - Takes up 1 column */}
        <div className="lg:col-span-1 h-auto lg:h-[500px]">
          <CalendarWidget
            events={calendarEvents}
            onAddEvent={(date) => {
              setSelectedDate(date);
              setIsEventModalOpen(true);
            }}
          />
        </div>

        {/* Upcoming Bookings - Takes up 2 columns */}
        <div className="lg:col-span-2 rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6 backdrop-blur h-auto lg:h-[500px] overflow-y-auto">
          <h3 className="text-base sm:text-lg font-semibold text-white sticky top-0 bg-[#1a1a1a] pb-3 sm:pb-4 z-10">Upcoming Bookings</h3>
          {analytics.bookings.upcoming_bookings.length === 0 ? (
            <p className="mt-4 text-sm text-white/50">No upcoming bookings</p>
          ) : (
            <div className="mt-4 space-y-3">
              {analytics.bookings.upcoming_bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl sm:rounded-2xl border border-white/5 bg-white/5 p-3 sm:p-4 gap-3 sm:gap-0"
                >
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-accent/20 text-xs sm:text-sm font-semibold text-accent flex-shrink-0">
                        {booking.client_name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-white truncate">{booking.client_name}</p>
                        <p className="text-[10px] sm:text-xs text-white/50 truncate">
                          {new Date(booking.booking_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="text-left sm:text-right">
                      <p className="text-xs sm:text-sm text-white/60">{booking.service_type.replace('_', ' ')}</p>
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <Users className="h-3 w-3" />
                        {booking.number_of_guests} guests
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm sm:text-base font-semibold text-white">
                        KSh {booking.total_amount.toLocaleString()}
                      </p>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${statusBadgeColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Status Overview */}
      <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6 backdrop-blur">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Booking Status</h3>
        <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <span className="text-xs sm:text-sm text-white/60">Pending</span>
            </div>
            <p className="text-xl sm:text-2xl font-semibold text-white">{analytics.bookings.pending}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-white/60">Confirmed</span>
            </div>
            <p className="text-2xl font-semibold text-white">{analytics.bookings.confirmed}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-white/60">Completed</span>
            </div>
            <p className="text-2xl font-semibold text-white">{analytics.bookings.completed}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm text-white/60">Cancelled</span>
            </div>
            <p className="text-2xl font-semibold text-white">{analytics.bookings.cancelled}</p>
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5 md:p-6 backdrop-blur">
        <h3 className="text-lg font-semibold text-white">Recent Reviews</h3>
        {analytics.reviews.recent_reviews.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">No reviews yet</p>
        ) : (
          <div className="mt-4 space-y-3">
            {analytics.reviews.recent_reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl sm:rounded-2xl border border-white/5 bg-white/5 p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-accent/20 text-xs sm:text-sm font-semibold text-accent flex-shrink-0">
                      {review.client_name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-medium text-white">{review.client_name}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'
                              }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-white/50">
                    {new Date(review.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-white/70">{review.comment}</p>
                )}
                <div className="mt-3 flex gap-4 text-xs text-white/50">
                  <span>Food: {review.food_quality}/5</span>
                  <span>Professionalism: {review.professionalism}/5</span>
                  <span>Punctuality: {review.punctuality}/5</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-surface-elevated p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-white mb-4">Add Event</h3>
            <p className="text-sm text-white/60 mb-6">
              Adding event for {selectedDate.toLocaleDateString()}
            </p>
            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Event Title</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-accent focus:outline-none"
                  placeholder="e.g., Vacation, Prep Time"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Description</label>
                <textarea
                  value={newEventDescription}
                  onChange={(e) => setNewEventDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-accent focus:outline-none"
                  placeholder="Optional details..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white hover:bg-accent-strong disabled:opacity-50"
                >
                  {isSubmittingEvent ? 'Adding...' : 'Add Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
