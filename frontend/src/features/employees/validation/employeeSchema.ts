import { z } from 'zod';

export const employeePositionOptions = [
  'MANAGER',
  'DISPATCHER',
  'DRIVER',
  'WAREHOUSE_OPERATOR',
  'ADMINISTRATIVE_WORKER',
] as const;

export const employeeSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(30, 'First name must be at most 30 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(30, 'Last name must be at most 30 characters'),
  jmbg: z
    .string()
    .trim()
    .min(1, 'JMBG is required')
    .max(13, 'JMBG must be at most 13 characters'),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be at most 20 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(30, 'Email must be at most 30 characters'),
  position: z.enum(employeePositionOptions, {
    message: 'Position is required',
  }),
  employmentDate: z
    .string()
    .trim()
    .min(1, 'Employment date is required'),
  salary: z
    .string()
    .trim()
    .min(1, 'Salary is required')
    .refine((value) => !Number.isNaN(Number(value)), {
      message: 'Salary must be a number',
    })
    .refine((value) => Number(value) > 0, {
      message: 'Salary must be greater than 0',
    }),
  userId: z
    .string()
    .trim()
    .refine((value) => value === '' || (!Number.isNaN(Number(value)) && Number(value) > 0), {
      message: 'Selected user is not valid',
    }),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;