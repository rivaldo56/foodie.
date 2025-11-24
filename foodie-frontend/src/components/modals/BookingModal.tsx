'use client';

import { useState } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import type { Chef, Booking } from '@/lib/api';
import { createBooking } from '@/lib/api/bookings';
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const displayName = chef.user?.full_name || `Chef #${chef.id}`;

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
                durationHours: 3,
                guestCount: guestCount,
                serviceType: 'private_dining',
                serviceAddress: '123 Main St',
                serviceCity: chef.city || 'Nairobi',
                serviceState: chef.state || 'Kenya',
                serviceZipCode: '00100',
                specialRequests: specialRequests,
            };

            const booking = await createBooking(payload);
            onSuccess(booking);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-lg max-h-[90vh] bg-gray-900 rounded-3xl overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/40 hover:bg-black/60 transition-colors"
                    aria-label="Close"
                >
                    <X className="h-6 w-6 text-white" />
                </button>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[90vh] scrollbar-hide">
                    <div className="p-8 space-y-6">
                        {/* Header */}
                        <h2 className="text-2xl font-bold text-white">
                            Book with {displayName}
                        </h2>

                        {/* Error Message */}
                        {error && (
                            <div className="rounded-2xl bg-red-900/40 border border-red-500/50 px-4 py-3 text-red-200 text-sm">
                                {error}
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
                                rows={4}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/50 focus:outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="sticky bottom-0 bg-gray-900 border-t border-white/10 p-6 flex gap-4">
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
                            className="flex-1 px-6 py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed rounded-2xl text-white font-semibold transition-colors"
                        >
                            {isSubmitting ? 'Sending...' : 'Send Booking Request'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
