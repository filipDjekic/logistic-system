import { z } from 'zod';

const emailPattern = /^[a-zA-Z]+\.[a-zA-Z]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .regex(emailPattern, 'Email must be in format firstName.lastName@firm.sector.countryCode'),
  password: z
    .string()
    .trim()
    .min(1, 'Password is required'),
});

export type LoginSchemaValues = z.infer<typeof loginSchema>;