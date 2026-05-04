import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(255, 'Email must be at most 255 characters')
    .email('Email is not valid'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginSchemaValues = z.infer<typeof loginSchema>;
