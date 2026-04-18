import { z } from 'zod';

export const userStatusOptions = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;

export const employeePositionOptions = [
  'OVERLORD',
  'COMPANY_ADMIN',
  'HR_MANAGER',
  'DISPATCHER',
  'DRIVER',
  'WAREHOUSE_MANAGER',
  'WORKER',
] as const;

const emailPattern = /^[a-zA-Z]+\.[a-zA-Z]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;

const roleIdSchema = z
  .string()
  .trim()
  .min(1, 'Role is required')
  .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
    message: 'Selected role is not valid',
  });

const salarySchema = z
  .string()
  .trim()
  .min(1, 'Salary is required')
  .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
    message: 'Salary must be greater than 0',
  });

export const createUserSchema = z.object({
  password: z
    .string()
    .trim()
    .min(1, 'Password is required')
    .max(255, 'Password must be at most 255 characters'),
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(60, 'First name must be at most 60 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(60, 'Last name must be at most 60 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(255, 'Email must be at most 255 characters')
    .email('Email is not valid')
    .regex(
      emailPattern,
      'Email must be in format firstName.lastName@firm.sector.countryCode',
    ),
  roleId: roleIdSchema,
  status: z.enum(userStatusOptions, {
    message: 'Status is required',
  }),
  employeeJmbg: z
    .string()
    .trim()
    .min(1, 'JMBG is required')
    .max(13, 'JMBG must be at most 13 characters'),
  employeePhoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be at most 20 characters'),
  employeePosition: z.enum(employeePositionOptions, {
    message: 'Employee position is required',
  }),
  employeeEmploymentDate: z
    .string()
    .trim()
    .min(1, 'Employment date is required'),
  employeeSalary: salarySchema,
});

export const updateUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, 'First name is required')
    .max(60, 'First name must be at most 60 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(60, 'Last name must be at most 60 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(50, 'Email must be at most 50 characters')
    .email('Email is not valid')
    .regex(
      emailPattern,
      'Email must be in format firstName.lastName@firm.sector.countryCode',
    ),
  roleId: roleIdSchema,
  enabled: z.boolean(),
  status: z.enum(userStatusOptions, {
    message: 'Status is required',
  }),
  employeeJmbg: z
    .string()
    .trim()
    .min(1, 'JMBG is required')
    .max(13, 'JMBG must be at most 13 characters'),
  employeePhoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .max(20, 'Phone number must be at most 20 characters'),
  employeePosition: z.enum(employeePositionOptions, {
    message: 'Employee position is required',
  }),
  employeeEmploymentDate: z
    .string()
    .trim()
    .min(1, 'Employment date is required'),
  employeeSalary: salarySchema,
  employeeActive: z.boolean(),
});

export type CreateUserFormSchemaValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormSchemaValues = z.infer<typeof updateUserSchema>;