'use client';

import { useState } from 'react';
import { useAdminBookings } from '@/hooks/useAdminBookings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CalendarDays, MapPin } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import type { BookingStatus } from '@/types/marketplace';

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
];

export default function AdminBookingsPage() {
  const { bookings, loading, error, updateBookingStatus } = useAdminBookings();
  const { showToast } = useToast();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    setUpdatingId(id);
    const ok = await updateBookingStatus(id, status);
    setUpdatingId(null);
    if (ok) showToast('Booking status updated', 'success');
    else showToast('Failed to update status', 'error');
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-10 w-10 animate-spin text-[#ff7642]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">Bookings</h1>
        <p className="text-[#cbd5f5] mt-1">View and update booking status.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {bookings.length === 0 ? (
        <Card className="bg-[#16181d] border-white/5 border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <CalendarDays className="h-12 w-12 text-[#94a3b8] mb-4" />
            <p className="text-[#f9fafb] font-medium">No bookings yet</p>
            <p className="text-[#94a3b8] text-sm mt-1">Bookings will appear here when clients make requests.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id} className="bg-[#16181d] border-white/5 overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg text-[#f9fafb]">
                      {booking.menu?.name ?? 'Menu'} — {booking.menu?.experience?.name ?? 'Experience'}
                    </CardTitle>
                    <p className="text-xs text-[#94a3b8] mt-1">#{booking.id.slice(0, 8)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        booking.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : booking.status === 'confirmed'
                            ? 'bg-green-500/20 text-green-500'
                            : booking.status === 'completed'
                              ? 'bg-blue-500/20 text-blue-500'
                              : booking.status === 'canceled'
                                ? 'bg-red-500/20 text-red-500'
                                : 'bg-[#94a3b8]/20 text-[#94a3b8]'
                      }`}
                    >
                      {booking.status}
                    </span>
                    <span className="text-xl font-bold text-[#ff7642]">KES {booking.total_price.toLocaleString()}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-4 text-sm text-[#cbd5f5]">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4 text-[#ff7642]" />
                    {new Date(booking.date_time).toLocaleString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-[#ff7642]" />
                    <span className="truncate max-w-xs">{booking.address}</span>
                  </span>
                  <span>{booking.guests_count} guests</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                  <span className="text-xs text-[#94a3b8]">Status:</span>
                  <Select
                    value={booking.status}
                    onValueChange={(v) => handleStatusChange(booking.id, v as BookingStatus)}
                  >
                    <SelectTrigger
                      className="w-[140px] h-8 bg-[#1f2228] border-white/10 text-[#f9fafb] text-xs"
                      disabled={updatingId === booking.id}
                    >
                      {updatingId === booking.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1f2228] border-white/10 text-[#f9fafb]">
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="hover:bg-[#ff7642]/10 focus:bg-[#ff7642]/10 text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
