import { z } from 'zod';

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(6, 'Password must be at least 6 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Registration form validation schema
 */
export const registerSchema = z.object({
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
    username: z
        .string()
        .min(1, 'Username is required')
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be less than 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    full_name: z
        .string()
        .min(1, 'Full name is required')
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name must be less than 100 characters'),
    phone_number: z
        .string()
        .optional()
        .refine(
            (val) => !val || /^(\+254|0)[17]\d{8}$/.test(val),
            'Invalid Kenyan phone number (e.g., +254712345678 or 0712345678)'
        ),
    role: z
        .enum(['client', 'chef'])
        .default('client'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    password2: z
        .string()
        .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.password2, {
    message: 'Passwords do not match',
    path: ['password2'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
