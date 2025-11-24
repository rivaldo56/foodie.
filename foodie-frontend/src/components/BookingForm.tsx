'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema, type BookingFormData } from '@/schemas/booking.schema';
import { Calendar, Users, Clock, MapPin, UtensilsCrossed } from 'lucide-react';

interface BookingFormProps {
    chefId: number;
    chefName: string;
    onSuccess?: (bookingId: number) => void;
    onCancel?: () => void;
}

const SERVICE_TYPES = [
    { value: 'personal_meal', label: 'Personal Meal', icon: UtensilsCrossed },
    { value: 'event_catering', label: 'Event Catering', icon: Users },
    { value: 'cooking_class', label: 'Cooking Class', icon: Clock },
    { value: 'meal_prep', label: 'Meal Prep', icon: Calendar },
];

const DIETARY_OPTIONS = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Nut-Free',
    'Halal',
    'Kosher',
    'Low-Carb',
    'Keto',
];

export default function BookingForm({ chefId, chefName, onSuccess, onCancel }: BookingFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<BookingFormData>({
        resolver: zodResolver(bookingSchema) as any,
        defaultValues: {
            chef_id: chefId,
            service_type: 'personal_meal',
            duration_hours: 2,
            number_of_guests: 2,
            dietary_requirements: [],
        },
    });

    const selectedDietary = watch('dietary_requirements') || [];

    const toggleDietary = (option: string) => {
        const current = selectedDietary;
        if (current.includes(option)) {
            setValue('dietary_requirements', current.filter(item => item !== option));
        } else {
            setValue('dietary_requirements', [...current, option]);
        }
    };

    const onSubmit = async (data: BookingFormData) => {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // TODO: Implement actual booking API call
            console.log('Booking data:', data);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Success
            if (onSuccess) {
                onSuccess(123); // Mock booking ID
            }
        } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Failed to create booking');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-white">Book {chefName}</h2>
                <p className="text-sm text-white/60">Fill in the details below to create your booking</p>
            </div>

            {/* Service Type */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-white">Service Type *</label>
                <div className="grid gap-3 sm:grid-cols-2">
                    {SERVICE_TYPES.map(({ value, label, icon: Icon }) => (
                        <label
                            key={value}
                            className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${watch('service_type') === value
                                ? 'border-accent bg-accent/10'
                                : 'border-white/10 bg-white/5 hover:border-white/20'
                                }`}
                        >
                            <input
                                type="radio"
                                value={value}
                                {...register('service_type')}
                                className="sr-only"
                            />
                            <Icon className="h-5 w-5 text-accent" />
                            <span className="text-sm font-medium text-white">{label}</span>
                        </label>
                    ))}
                </div>
                {errors.service_type && (
                    <p className="text-sm text-red-400">{errors.service_type.message}</p>
                )}
            </div>

            {/* Date and Time */}
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Booking Date *</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                        <input
                            type="datetime-local"
                            {...register('booking_date', {
                                setValueAs: (value) => value ? new Date(value) : undefined,
                            })}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-white/40 backdrop-blur transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </div>
                    {errors.booking_date && (
                        <p className="text-sm text-red-400">{errors.booking_date.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Duration (hours) *</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                        <input
                            type="number"
                            min="1"
                            max="12"
                            {...register('duration_hours', { valueAsNumber: true })}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-white/40 backdrop-blur transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </div>
                    {errors.duration_hours && (
                        <p className="text-sm text-red-400">{errors.duration_hours.message}</p>
                    )}
                </div>
            </div>

            {/* Number of Guests */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-white">Number of Guests *</label>
                <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                    <input
                        type="number"
                        min="1"
                        max="100"
                        {...register('number_of_guests', { valueAsNumber: true })}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-white/40 backdrop-blur transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                </div>
                {errors.number_of_guests && (
                    <p className="text-sm text-red-400">{errors.number_of_guests.message}</p>
                )}
            </div>

            {/* Service Address */}
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Service Address *</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-white/40" />
                        <textarea
                            {...register('service_address')}
                            rows={3}
                            placeholder="Enter full address where service will be provided"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-white/40 backdrop-blur transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                    </div>
                    {errors.service_address && (
                        <p className="text-sm text-red-400">{errors.service_address.message}</p>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">City *</label>
                        <input
                            type="text"
                            {...register('service_city')}
                            placeholder="e.g., Nairobi"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/40 backdrop-blur transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        {errors.service_city && (
                            <p className="text-sm text-red-400">{errors.service_city.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">County *</label>
                        <input
                            type="text"
                            {...register('service_state')}
                            placeholder="e.g., Nairobi"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/40 backdrop-blur transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        {errors.service_state && (
                            <p className="text-sm text-red-400">{errors.service_state.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-white">Postal Code *</label>
                        <input
                            type="text"
                            {...register('service_zip_code')}
                            placeholder="e.g., 00100"
                            maxLength={5}
                            className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/40 backdrop-blur transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        {errors.service_zip_code && (
                            <p className="text-sm text-red-400">{errors.service_zip_code.message}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Dietary Requirements */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-white">Dietary Requirements</label>
                <div className="flex flex-wrap gap-2">
                    {DIETARY_OPTIONS.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => toggleDietary(option)}
                            className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedDietary.includes(option)
                                ? 'bg-accent text-white'
                                : 'border border-white/20 bg-white/5 text-white/70 hover:border-white/40'
                                }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            {/* Special Requests */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-white">Special Requests</label>
                <textarea
                    {...register('special_requests')}
                    rows={4}
                    placeholder="Any special requests or notes for the chef..."
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 px-4 text-white placeholder-white/40 backdrop-blur transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                {errors.special_requests && (
                    <p className="text-sm text-red-400">{errors.special_requests.message}</p>
                )}
            </div>

            {/* Submit Error */}
            {submitError && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-sm text-red-400">{submitError}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="flex-1 rounded-full border border-white/20 py-3 px-6 font-medium text-white transition hover:border-white/40 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-full bg-accent py-3 px-6 font-medium text-white shadow-glow transition hover:bg-accent-strong disabled:opacity-50"
                >
                    {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
                </button>
            </div>
        </form>
    );
}
