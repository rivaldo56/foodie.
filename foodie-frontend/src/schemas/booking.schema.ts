import { z } from 'zod';

/**
 * Booking form validation schema
 */
export const bookingSchema = z.object({
    chef_id: z
        .number()
        .positive('Please select a valid chef'),

    service_type: z
        .enum(['personal_meal', 'event_catering', 'cooking_class', 'meal_prep']),

    booking_date: z
        .date()
        .refine((date) => date > new Date(), {
            message: 'Booking date must be in the future',
        }),

    duration_hours: z
        .number()
        .min(1, 'Duration must be at least 1 hour')
        .max(12, 'Duration cannot exceed 12 hours'),

    number_of_guests: z
        .number()
        .min(1, 'At least 1 guest is required')
        .max(100, 'Maximum 100 guests allowed'),

    service_address: z
        .string()
        .min(1, 'Service address is required')
        .min(10, 'Please provide a complete address')
        .max(500, 'Address is too long'),

    service_city: z
        .string()
        .min(1, 'City is required')
        .max(100, 'City name is too long'),

    service_state: z
        .string()
        .min(1, 'State/County is required')
        .max(100, 'State/County name is too long'),

    service_zip_code: z
        .string()
        .min(1, 'Postal code is required')
        .regex(/^\d{5}$/, 'Postal code must be 5 digits'),

    dietary_requirements: z
        .array(z.string())
        .default([]),

    special_requests: z
        .string()
        .max(1000, 'Special requests must be less than 1000 characters')
        .optional(),

    menu_items: z
        .array(z.number())
        .default([]),
});

export type BookingFormData = z.infer<typeof bookingSchema>;

/**
 * Quick booking schema (simplified version)
 */
export const quickBookingSchema = bookingSchema.pick({
    chef_id: true,
    booking_date: true,
    number_of_guests: true,
    service_type: true,
});

export type QuickBookingFormData = z.infer<typeof quickBookingSchema>;
