import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address')
    .regex(
      /^[a-zA-Z]+\\.[a-zA-Z]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-]+\\.[a-zA-Z]{2,}$/,
      'Email must be in format firstName.lastName@firm.sector.countryCode',
    ),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(255, 'Password must be at most 255 characters'),
});

export type LoginSchemaValues = z.infer<typeof loginSchema>;