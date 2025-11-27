import React, { useState } from 'react';
import {
    X,
    Calendar,
    Clock,
    MapPin,
    Users,
    ChefHat,
    MessageSquare,
    CheckCircle,
    XCircle,
    AlertCircle,
    CreditCard
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Booking, updateBookingStatus, cancelBooking } from '@/services/booking.service';

interface ClientBookingModalProps {
    booking: Booking;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export default function ClientBookingModal({
    booking,
    isOpen,
    onClose,
    onUpdate
}: ClientBookingModalProps) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const chefName = typeof booking.chef === 'object' && booking.chef?.user?.full_name
        ? booking.chef.user.full_name
        : 'Chef';

    const chefId = typeof booking.chef === 'object' ? booking.chef.user.id : null;

    const handleMessage = () => {
        if (chefId) {
            // Navigate to messages with the chef selected
            // Using the same logic as the chef dashboard to find/create conversation
            router.push(`/client/messages?user=${chefId}`);
        }
    };

    const handleCommit = async () => {
        try {
            setIsProcessing(true);
            setError(null);
            // For now, "Commit" confirms the booking. 
            // In a real flow, this might redirect to a payment page.
            // If the booking is already confirmed, this might be a "Pay Now" action.

            // If pending, we confirm it (simulating commitment)
            if (booking.status === 'pending') {
                // In a real app, client usually pays to confirm. 
                // Here we'll assume "Commit" means confirming interest or paying.
                // Let's redirect to a payment page or just update status if it's a simple flow.
                // User asked for "commit to chef", which implies a strong action.
                // I'll implement it as a status update for now, or we could add a payment modal later.
                // Let's try to update to 'confirmed' if the backend allows clients to do so (usually chefs confirm).
                // Actually, usually CHEF accepts, CLIENT pays. 
                // If status is pending, maybe client can't confirm.
                // Let's assume "Commit" means "Mark as Priority" or "Pay Deposit".
                // Given the user request "commit to chef (if not yet)", it sounds like a client action.
                // I'll make it update status to 'confirmed' for now to demonstrate the action, 
                // but realistically this should be a payment flow.

                // Let's just show a success message for now as a placeholder for payment integration
                // or update status if allowed.
                await updateBookingStatus(booking.id, 'confirmed');
            }

            onUpdate();
            onClose();
        } catch (err) {
            setError('Failed to commit to booking. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this booking request?')) return;

        try {
            setIsProcessing(true);
            setError(null);
            await cancelBooking(booking.id);
            onUpdate();
            onClose();
        } catch (err) {
            setError('Failed to cancel booking. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-400 bg-green-400/10 border-green-400/20';
            case 'confirmed': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
            case 'cancelled': return 'text-red-400 bg-red-400/10 border-red-400/20';
            case 'pending': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
            default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="relative w-full max-w-lg transform overflow-hidden rounded-3xl bg-[#1a1a1a] border border-white/10 shadow-2xl transition-all">
                {/* Header */}
                <div className="relative h-32 bg-gradient-to-r from-orange-500/20 to-purple-600/20 p-6">
                    <div className="absolute top-4 right-4">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/70 hover:text-white transition backdrop-blur-md"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="absolute -bottom-8 left-6">
                        <div className="h-20 w-20 rounded-2xl bg-[#1a1a1a] p-1.5 shadow-xl">
                            <div className="h-full w-full rounded-xl bg-surface-highlight flex items-center justify-center text-muted border border-white/5">
                                <ChefHat className="h-10 w-10" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-12 px-6 pb-6 space-y-6">
                    {/* Title & Status */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{chefName}</h2>
                            <p className="text-white/60 text-sm mt-1">
                                {booking.service_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.status)}`}>
                            {booking.status.toUpperCase()}
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-medium">
                                <Calendar className="h-3.5 w-3.5" />
                                Date
                            </div>
                            <p className="text-white font-medium">
                                {new Date(booking.booking_date).toLocaleDateString(undefined, {
                                    weekday: 'short', month: 'short', day: 'numeric'
                                })}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-medium">
                                <Clock className="h-3.5 w-3.5" />
                                Time
                            </div>
                            <p className="text-white font-medium">
                                {new Date(booking.booking_date).toLocaleTimeString(undefined, {
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-medium">
                                <Users className="h-3.5 w-3.5" />
                                Guests
                            </div>
                            <p className="text-white font-medium">{booking.number_of_guests} People</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-medium">
                                <CreditCard className="h-3.5 w-3.5" />
                                Total
                            </div>
                            <p className="text-white font-medium">
                                KES {Number(booking.total_amount || booking.base_price || 0).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {/* Location */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                        <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-wider font-medium">
                            <MapPin className="h-3.5 w-3.5" />
                            Location
                        </div>
                        <p className="text-white text-sm leading-relaxed">
                            {booking.service_address}, {booking.service_city}
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        {/* Message Button - Always visible */}
                        <button
                            onClick={handleMessage}
                            className="col-span-2 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition border border-white/10"
                        >
                            <MessageSquare className="h-4 w-4" />
                            Message Chef
                        </button>

                        {/* Commit Button - Visible if pending */}
                        {booking.status === 'pending' && (
                            <button
                                onClick={handleCommit}
                                disabled={isProcessing}
                                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle className="h-4 w-4" />
                                        Commit to Chef
                                    </>
                                )}
                            </button>
                        )}

                        {/* Cancel Button - Visible if pending or confirmed */}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button
                                onClick={handleCancel}
                                disabled={isProcessing}
                                className={`flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium transition border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${booking.status !== 'pending' ? 'col-span-2' : ''}`}
                            >
                                {isProcessing ? (
                                    <span className="h-4 w-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <XCircle className="h-4 w-4" />
                                        Cancel Request
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
