import { z } from 'zod';

export const companyAdminPositionOptions = [
  'MANAGER',
  'DISPATCHER',
  'DRIVER',
  'WAREHOUSE_OPERATOR',
  'ADMINISTRATIVE_WORKER',
] as const;

export const companyAdminStatusOptions = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;

const emailPattern = /^[a-z]+\.[a-z]+@[a-z]+\.[a-z]+\.[a-z]{2,}$/;

export const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .max(120, 'Company name must be at most 120 characters'),
  active: z.boolean(),

  adminFirstName: z.string().trim().min(1, 'First name is required').max(60),
  adminLastName: z.string().trim().min(1, 'Last name is required').max(60),
  adminEmail: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(50)
    .email('Email is not valid')
    .regex(
      emailPattern,
      'Email must be in format firstName.lastName@firm.sector.countryCode',
    ),
  adminPassword: z
    .string()
    .trim()
    .min(8, 'Password must be at least 8 characters')
    .max(255),
  adminStatus: z.enum(companyAdminStatusOptions),

  adminJmbg: z.string().trim().min(1, 'JMBG is required').max(13),
  adminPhoneNumber: z.string().trim().min(1, 'Phone number is required').max(20),
  adminPosition: z.enum(companyAdminPositionOptions),
  adminEmploymentDate: z.string().trim().min(1, 'Employment date is required'),
  adminSalary: z
    .string()
    .trim()
    .min(1, 'Salary is required')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: 'Salary must be greater than 0',
    }),
});

export type CompanySchemaValues = z.infer<typeof companySchema>;