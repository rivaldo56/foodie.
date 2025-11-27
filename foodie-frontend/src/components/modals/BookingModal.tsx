'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Chef } from '@/services/chef.service';
import { Booking, bookingService } from '@/services/booking.service';
import CalendarWidget from '@/components/CalendarWidget';

interface BookingModalProps {
    chef: Chef;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (booking: Booking) => void;
}

const TIME_SLOTS = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM',
    '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
    '09:00 PM'
];

const GUEST_OPTIONS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function BookingModal({ chef, isOpen, onClose, onSuccess }: BookingModalProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [guestCount, setGuestCount] = useState(2);
    const [specialRequests, setSpecialRequests] = useState('');
    const [isPriority, setIsPriority] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedDate(null);
            setSelectedTime('');
            setGuestCount(2);
            setSpecialRequests('');
            setIsPriority(false);
            setError(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const displayName = chef.user?.full_name || `Chef #${chef.id}`;

    // Calculate estimated costs
    const hourlyRate = chef.hourly_rate || 50; // Default fallback
    const durationHours = 3; // Hardcoded for now
    const estimatedTotal = hourlyRate * durationHours;
    const downPaymentAmount = Math.round(estimatedTotal * 0.3); // 30% down payment

    const handleSubmit = async () => {
        if (!selectedDate || !selectedTime) {
            setError('Please select both date and time');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Parse time and create booking date
            const [time, period] = selectedTime.split(' ');
            const [hours, minutes] = time.split(':').map(Number);
            const adjustedHours = period === 'PM' && hours !== 12 ? hours + 12 : hours === 12 && period === 'AM' ? 0 : hours;

            const bookingDateTime = new Date(selectedDate);
            bookingDateTime.setHours(adjustedHours, minutes, 0, 0);

            const payload = {
                chefId: chef.id,
                eventDate: bookingDateTime.toISOString().split('T')[0],
                eventTime: bookingDateTime.toTimeString().split(' ')[0],
                durationHours: durationHours,
                guestCount: guestCount,
                serviceType: 'personal_meal', // Valid choices: personal_meal, event_catering, cooking_class, meal_prep
                serviceAddress: '123 Main St', // Should be dynamic in real app
                serviceCity: chef.city || 'Nairobi',
                serviceState: chef.state || 'Kenya',
                serviceZipCode: '00100',
                specialRequests: specialRequests,
                isPriority: isPriority,
                downPaymentAmount: isPriority ? downPaymentAmount : 0,
            };

            const booking = await bookingService.createBooking(payload);
            onSuccess(booking);
            onClose();
        } catch (err) {
            console.error('Booking error:', err);
            setError(err instanceof Error ? err.message : 'Failed to create booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg max-h-[90vh] bg-gray-900 rounded-3xl overflow-hidden flex flex-col">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                    aria-label="Close"
                >
                    <X className="h-6 w-6 text-white" />
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 scrollbar-hide">
                    <div className="p-8 space-y-6">
                        {/* Header */}
                        <div>
                            <h2 className="text-2xl font-bold text-white">
                                Book with {displayName}
                            </h2>
                            <p className="text-white/60 text-sm mt-1">
                                Fill in the details below to request a booking.
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-2xl bg-red-900/40 border border-red-500/50 px-4 py-3 text-red-200 text-sm flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Select Date */}
                        <div className="space-y-3">
                            <label className="text-white font-semibold">Select Date</label>
                            <CalendarWidget
                                events={[]}
                                onDateSelect={setSelectedDate}
                            />
                        </div>

                        {/* Select Time */}
                        <div className="space-y-3">
                            <label className="text-white font-semibold">Select Time</label>
                            <select
                                value={selectedTime}
                                onChange={(e) => setSelectedTime(e.target.value)}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                            >
                                <option value="" className="bg-gray-900">Choose a time</option>
                                {TIME_SLOTS.map((time) => (
                                    <option key={time} value={time} className="bg-gray-900">
                                        {time}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Number of Guests */}
                        <div className="space-y-3">
                            <label className="text-white font-semibold">Number of Guests</label>
                            <select
                                value={guestCount}
                                onChange={(e) => setGuestCount(Number(e.target.value))}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all"
                            >
                                {GUEST_OPTIONS.map((count) => (
                                    <option key={count} value={count} className="bg-gray-900">
                                        {count} Guest{count > 1 ? 's' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Special Requests */}
                        <div className="space-y-3">
                            <label className="text-white font-semibold">
                                Special Requests <span className="text-white/50 font-normal">(Optional)</span>
                            </label>
                            <textarea
                                value={specialRequests}
                                onChange={(e) => setSpecialRequests(e.target.value)}
                                placeholder="Dietary restrictions, allergies, menu preferences..."
                                rows={3}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                            />
                        </div>

                        {/* Priority Booking Option */}
                        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 space-y-3">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={isPriority}
                                        onChange={(e) => setIsPriority(e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <div className="h-6 w-6 rounded-lg border-2 border-white/20 peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all"></div>
                                    <CheckCircle className="absolute inset-0 h-6 w-6 text-white opacity-0 peer-checked:opacity-100 transition-opacity p-0.5" />
                                </div>
                                <div className="flex-1">
                                    <span className="block text-white font-semibold group-hover:text-orange-400 transition-colors">
                                        Commit (Priority Request)
                                    </span>
                                    <span className="text-white/60 text-sm">
                                        Pay a down payment to prioritize your request and show commitment.
                                    </span>
                                </div>
                            </label>

                            {isPriority && (
                                <div className="pl-9 text-sm">
                                    <div className="flex justify-between items-center text-white/80 py-2 border-t border-white/10 mt-2">
                                        <span>Estimated Total:</span>
                                        <span>${estimatedTotal}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-orange-400 font-semibold py-1">
                                        <span>Down Payment (30%):</span>
                                        <span>${downPaymentAmount}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-900 border-t border-white/10 p-6 flex gap-4 shrink-0">
                    <button
                        onClick={onClose}
                        className="flex items-center justify-center gap-2 px-6 py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-semibold transition-colors border border-white/20"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedDate || !selectedTime}
                        className="flex-1 px-6 py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed rounded-2xl text-white font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <span>
                                {isPriority ? `Pay $${downPaymentAmount} & Book` : 'Send Request'}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
