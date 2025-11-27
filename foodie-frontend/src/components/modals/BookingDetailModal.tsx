'use client';

import { useState } from 'react';
import { X, Calendar, Users, MapPin, Clock, DollarSign, MessageCircle, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Booking } from '@/services/booking.service';

interface BookingDetailModalProps {
    booking: Booking | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusUpdate: () => void;
}

export default function BookingDetailModal({ booking, isOpen, onClose, onStatusUpdate }: BookingDetailModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);

    if (!isOpen || !booking) return null;

    const handleAccept = async () => {
        setLoading(true);
        setActionType('accept');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings/${booking.id}/status/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ status: 'confirmed' }),
            });

            if (!response.ok) throw new Error('Failed to accept booking');

            onStatusUpdate();
            onClose();
        } catch (error) {
            console.error('Error accepting booking:', error);
            alert('Failed to accept booking');
        } finally {
            setLoading(false);
            setActionType(null);
        }
    };

    const handleReject = async () => {
        if (!confirm('Are you sure you want to reject this booking?')) return;

        setLoading(true);
        setActionType('reject');
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/bookings/${booking.id}/status/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ status: 'cancelled' }),
            });

            if (!response.ok) throw new Error('Failed to reject booking');

            onStatusUpdate();
            onClose();
        } catch (error) {
            console.error('Error rejecting booking:', error);
            alert('Failed to reject booking');
        } finally {
            setLoading(false);
            setActionType(null);
        }
    };

    const handleMessage = () => {
        // Navigate to messages - the messages page will handle finding/creating conversation
        const clientId = typeof booking.client === 'object' ? booking.client.id : booking.client;
        router.push(`/chef/messages?user=${clientId}`);
        onClose();
    };

    const bookingDate = new Date(booking.booking_date);
    const isPending = booking.status === 'pending';

    // Handle both analytics data (client_name string) and full booking data (client object)
    const clientName = (booking as any).client_name ||
        (typeof booking.client === 'object' ? booking.client.full_name : 'Client');
    const clientEmail = typeof booking.client === 'object' ? booking.client.email : '';
    const clientId = (booking as any).client_id ||
        (typeof booking.client === 'object' ? booking.client.id : booking.client);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a1a1a] via-[#1a1a1a] to-[#0a0a0a] shadow-2xl shadow-black/50 backdrop-blur-xl">
                {/* Header with gradient */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent backdrop-blur-md p-6">
                    <div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                            Booking Details
                        </h2>
                        <p className="text-sm text-white/50">Confirmation Code: <span className="text-orange-400 font-mono">#{booking.confirmation_code || booking.id}</span></p>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition-all hover:rotate-90 duration-300"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {/* Client Info - Clickable */}
                    <button
                        onClick={() => router.push(`/chef/clients/${clientId}`)}
                        className="w-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-5 hover:from-white/15 hover:to-white/10 hover:border-orange-500/30 transition-all duration-300 group"
                    >
                        <h3 className="text-xs font-medium text-white/50 mb-3 text-left uppercase tracking-wider">Client Information</h3>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-xl font-bold text-white shadow-lg shadow-orange-500/20">
                                    {clientName.split(' ').map((n: string) => n[0]).join('')}
                                </div>
                                <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-[#1a1a1a]"></div>
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-semibold text-white text-lg group-hover:text-orange-400 transition-colors">
                                    {clientName}
                                </p>
                                <p className="text-sm text-white/50">
                                    {clientEmail}
                                </p>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="text-orange-400">→</div>
                            </div>
                        </div>
                    </button>

                    {/* Booking Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 hover:from-white/10 hover:border-orange-500/20 transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 rounded-lg bg-orange-500/20">
                                    <Calendar className="h-4 w-4 text-orange-400" />
                                </div>
                                <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Date & Time</span>
                            </div>
                            <p className="text-white font-semibold text-sm">
                                {bookingDate.toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </p>
                            <p className="text-sm text-orange-400 font-medium mt-1">
                                {bookingDate.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 hover:from-white/10 hover:border-orange-500/20 transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 rounded-lg bg-orange-500/20">
                                    <Clock className="h-4 w-4 text-orange-400" />
                                </div>
                                <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Duration</span>
                            </div>
                            <p className="text-white font-semibold">{booking.duration_hours} hours</p>
                            <p className="text-sm text-white/60 capitalize">{booking.service_type.replace('_', ' ')}</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 hover:from-white/10 hover:border-orange-500/20 transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 rounded-lg bg-orange-500/20">
                                    <Users className="h-4 w-4 text-orange-400" />
                                </div>
                                <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Guests</span>
                            </div>
                            <p className="text-white font-semibold">{booking.number_of_guests} people</p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4 hover:from-white/10 hover:border-orange-500/20 transition-all">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 rounded-lg bg-orange-500/20">
                                    <DollarSign className="h-4 w-4 text-orange-400" />
                                </div>
                                <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Total Amount</span>
                            </div>
                            <p className="text-white font-bold text-lg">KSh {Number(booking.total_amount).toLocaleString()}</p>
                            {booking.is_priority && (
                                <p className="text-xs text-green-400 flex items-center gap-1 mt-2 font-medium">
                                    <CheckCircle className="h-3.5 w-3.5" />
                                    Priority ({Number(booking.down_payment_amount).toFixed(0)}% paid)
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5 hover:from-white/10 hover:border-orange-500/20 transition-all">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="p-1.5 rounded-lg bg-orange-500/20">
                                <MapPin className="h-4 w-4 text-orange-400" />
                            </div>
                            <span className="text-xs font-medium text-white/50 uppercase tracking-wide">Service Location</span>
                        </div>
                        <p className="text-white font-medium">{booking.service_address}</p>
                        <p className="text-sm text-white/60 mt-1">
                            {booking.service_city}, {booking.service_state} {booking.service_zip_code}
                        </p>
                    </div>

                    {/* Special Requests */}
                    {booking.special_requests && (
                        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5 hover:from-white/10 hover:border-orange-500/20 transition-all">
                            <h3 className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wide">Special Requests</h3>
                            <p className="text-white text-sm leading-relaxed">{booking.special_requests}</p>
                        </div>
                    )}

                    {/* Dietary Requirements */}
                    {booking.dietary_requirements && booking.dietary_requirements.length > 0 && (
                        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-5 hover:from-white/10 hover:border-orange-500/20 transition-all">
                            <h3 className="text-xs font-medium text-white/50 mb-3 uppercase tracking-wide">Dietary Requirements</h3>
                            <div className="flex flex-wrap gap-2">
                                {booking.dietary_requirements.map((req, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium border border-white/5 hover:bg-white/20 transition-colors"
                                    >
                                        {req}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warning for pending bookings */}
                    {isPending && (
                        <div className="rounded-2xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 p-5 flex items-start gap-3 shadow-lg shadow-yellow-500/5">
                            <div className="p-2 rounded-lg bg-yellow-500/20">
                                <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                            </div>
                            <p className="text-sm text-yellow-100 leading-relaxed">
                                This booking is pending your response. Please accept or reject it as soon as possible.
                            </p>
                        </div>
                    )}
                </div>

                {/* Actions with gradient background */}
                <div className="sticky bottom-0 border-t border-white/10 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent backdrop-blur-md p-6 flex gap-3">
                    <button
                        onClick={handleMessage}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/20 py-3.5 text-blue-300 font-semibold hover:bg-blue-500/30 hover:border-blue-500/50 hover:text-blue-200 transition-all hover:scale-105 active:scale-95"
                    >
                        <MessageCircle className="h-5 w-5" />
                        Message
                    </button>

                    {isPending && (
                        <>
                            <button
                                onClick={handleReject}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/20 py-3.5 text-red-300 font-semibold hover:bg-red-500/30 hover:border-red-500/50 hover:text-red-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {loading && actionType === 'reject' ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-red-300 border-t-transparent" />
                                ) : (
                                    <XCircle className="h-5 w-5" />
                                )}
                                Reject
                            </button>

                            <button
                                onClick={handleAccept}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-green-600 py-3.5 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            >
                                {loading && actionType === 'accept' ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                ) : (
                                    <CheckCircle className="h-5 w-5" />
                                )}
                                Accept
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
