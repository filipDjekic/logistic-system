import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .regex(
      /^[a-z]+\.[a-z]+@[a-z]+\.[a-z]+\.[a-z]{2,}$/,
      'Email must be in format firstName.lastName@firm.sector.countryCode',
    ),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(255, 'Password must be at most 255 characters'),
});

export type LoginSchemaValues = z.infer<typeof loginSchema>;