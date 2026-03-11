'use client';

import { useState } from 'react';
import { useAdminBookings } from '@/hooks/useAdminBookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  CalendarDays, 
  MapPin, 
  Users,
  CreditCard, 
  ShieldCheck, 
  RotateCcw,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import type { BookingStatus } from '@/types/marketplace';

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'rotating', label: 'Rotating (V3)' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'awaiting_client_confirmation', label: 'Client Confirming' },
  { value: 'payout_processing', label: 'Payout Processing' },
  { value: 'paid_out', label: 'Paid Out' },
  { value: 'disputed', label: 'Disputed' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500/20 text-yellow-500';
    case 'rotating': return 'bg-purple-500/20 text-purple-400 border border-purple-500/30';
    case 'assigned': return 'bg-blue-500/20 text-blue-400';
    case 'confirmed': return 'bg-emerald-500/20 text-emerald-400';
    case 'completed': return 'bg-green-500/20 text-green-500';
    case 'canceled': return 'bg-red-500/20 text-red-500';
    case 'awaiting_client_confirmation': return 'bg-indigo-500/20 text-indigo-400';
    case 'paid_out': return 'bg-emerald-600/20 text-emerald-300';
    case 'disputed': return 'bg-red-600/20 text-red-300 animate-pulse';
    default: return 'bg-[#94a3b8]/20 text-[#94a3b8]';
  }
};

const getEscrowColor = (status: string) => {
  switch (status) {
    case 'held': return 'text-blue-400';
    case 'released': return 'text-emerald-400';
    case 'refunded': return 'text-amber-400';
    case 'frozen': return 'text-red-400';
    default: return 'text-gray-500';
  }
};

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">Bookings</h1>
          <p className="text-[#cbd5f5] mt-1">Manage global demand and chef execution.</p>
        </div>
        <div className="p-2 bg-[#ff7642]/10 rounded-lg hidden md:block">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#ff7642]">Booking Engine V3 Active</span>
        </div>
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
            <Card key={booking.id} className="bg-[#16181d] border-white/5 overflow-hidden hover:border-white/10 transition-colors group">
              <CardHeader className="pb-4 border-b border-white/5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-[#f9fafb] group-hover:text-[#ff7642] transition-colors">
                      {booking.menu?.name ?? 'Menu'} 
                    </CardTitle>
                    <p className="text-xs text-[#94a3b8]">
                        {booking.menu?.experience?.name ?? 'Curated Experience'} • #{booking.id.slice(0, 8)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                        <span className="text-xl font-bold text-[#ff7642]">KES {booking.total_price.toLocaleString()}</span>
                        {booking.deposit_amount && (
                            <p className="text-[10px] text-gray-500">Deposit: KES {booking.deposit_amount.toLocaleString()}</p>
                        )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                        {booking.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Time & Place */}
                    <div className="space-y-3">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Logistics</p>
                        <div className="space-y-2 text-sm text-[#cbd5f5]">
                            <span className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-[#ff7642]" />
                                {new Date(booking.date_time).toLocaleString()}
                            </span>
                            <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-[#ff7642]" />
                                <span className="truncate max-w-[150px]" title={booking.address}>{booking.address}</span>
                            </span>
                            <span className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-[#ff7642]" />
                                {booking.guests_count} Guests
                            </span>
                        </div>
                    </div>

                    {/* Payment Pillar */}
                    <div className="space-y-3">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Payment & Escrow</p>
                        <div className="space-y-2 text-sm text-[#cbd5f5]">
                             <span className="flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-blue-400" />
                                <span className="capitalize">{booking.payment_model.replace(/_/g, ' ')}</span>
                            </span>
                            <span className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                                <span>Escrow: <span className={`font-semibold ${getEscrowColor(booking.escrow_status)}`}>{booking.escrow_status.toUpperCase()}</span></span>
                            </span>
                        </div>
                    </div>

                    {/* Rotation Pillar */}
                    <div className="space-y-3">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Rotation & SLA</p>
                         <div className="space-y-2 text-sm text-[#cbd5f5]">
                            <span className="flex items-center gap-2">
                                <RotateCcw className="h-4 w-4 text-purple-400" />
                                <span>Tried {booking.rotation_count} chefs</span>
                            </span>
                            {booking.sla_expires_at && (
                                <span className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-amber-500" />
                                    <span>SLA: {new Date(booking.sla_expires_at).toLocaleTimeString()}</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions Pillar */}
                    <div className="space-y-3">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Admin Controls</p>
                        <div className="flex flex-col gap-2">
                            <Select
                                value={booking.status}
                                onValueChange={(v) => handleStatusChange(booking.id, v as BookingStatus)}
                            >
                                <SelectTrigger
                                    className="w-full h-9 bg-[#1f2228] border-white/10 text-[#f9fafb] text-xs"
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
                            <Button variant="outline" size="sm" className="h-8 border-white/5 bg-white/5 text-[10px] hover:bg-white/10">
                                <ExternalLink className="h-3 w-3 mr-1" /> View Details
                            </Button>
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
