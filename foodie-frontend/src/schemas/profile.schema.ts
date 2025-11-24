import { z } from 'zod';

/**
 * Profile update validation schema
 */
export const profileSchema = z.object({
    full_name: z
        .string()
        .min(1, 'Full name is required')
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name must be less than 100 characters'),

    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address'),

    phone_number: z
        .string()
        .optional()
        .refine(
            (val) => !val || /^(\+254|0)[17]\d{8}$/.test(val),
            'Invalid Kenyan phone number (e.g., +254712345678 or 0712345678)'
        ),

    bio: z
        .string()
        .max(1000, 'Bio must be less than 1000 characters')
        .optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Chef profile update validation schema
 */
export const chefProfileSchema = profileSchema.extend({
    specialties: z
        .array(z.string())
        .min(1, 'Please select at least one specialty')
        .max(10, 'Maximum 10 specialties allowed'),

    experience_level: z
        .enum(['beginner', 'intermediate', 'experienced', 'expert']),

    years_of_experience: z
        .number()
        .min(0, 'Years of experience cannot be negative')
        .max(50, 'Years of experience seems too high'),

    hourly_rate: z
        .number()
        .min(500, 'Hourly rate must be at least KSh 500')
        .max(50000, 'Hourly rate cannot exceed KSh 50,000'),

    service_radius: z
        .number()
        .min(1, 'Service radius must be at least 1 km')
        .max(100, 'Service radius cannot exceed 100 km'),

    address: z
        .string()
        .min(1, 'Address is required')
        .max(500, 'Address is too long'),

    city: z
        .string()
        .min(1, 'City is required')
        .max(100, 'City name is too long'),

    state: z
        .string()
        .min(1, 'State/County is required')
        .max(100, 'State/County name is too long'),

    zip_code: z
        .string()
        .min(1, 'Postal code is required')
        .regex(/^\d{5}$/, 'Postal code must be 5 digits'),
});

export type ChefProfileFormData = z.infer<typeof chefProfileSchema>;

/**
 * Password change validation schema
 */
export const passwordChangeSchema = z.object({
    current_password: z
        .string()
        .min(1, 'Current password is required'),

    new_password: z
        .string()
        .min(1, 'New password is required')
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),

    confirm_password: z
        .string()
        .min(1, 'Please confirm your new password'),
}).refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
});

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
