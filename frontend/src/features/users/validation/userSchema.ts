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

const roleIdSchema = z
  .string()
  .trim()
  .min(1, 'Role is required')
  .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
    message: 'Selected role is not valid',
  });

const companyIdSchema = z
  .string()
  .trim()
  .min(1, 'Company is required')
  .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
    message: 'Selected company is not valid',
  });

const salarySchema = z
  .string()
  .trim()
  .min(1, 'Salary is required')
  .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
    message: 'Salary must be greater than 0',
  });

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(255, 'Email must be at most 255 characters')
  .email('Email is not valid');

const employeePhoneNumberSchema = z
  .string()
  .trim()
  .min(1, 'Phone number is required')
  .max(30, 'Phone number must be at most 30 characters');

const employeeBaseSchema = {
  employeeJmbg: z
    .string()
    .trim()
    .min(1, 'JMBG is required')
    .max(13, 'JMBG must be at most 13 characters'),
  employeePhoneNumber: employeePhoneNumberSchema,
  employeePosition: z.enum(employeePositionOptions, {
    message: 'Employee position is required',
  }),
  employeeEmploymentDate: z
    .string()
    .trim()
    .min(1, 'Employment date is required'),
  employeeSalary: salarySchema,
};

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
  email: emailSchema,
  roleId: roleIdSchema,
  status: z.enum(userStatusOptions, {
    message: 'Status is required',
  }),
  companyId: companyIdSchema,
  ...employeeBaseSchema,
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
  email: emailSchema,
  roleId: roleIdSchema,
  enabled: z.boolean(),
  status: z.enum(userStatusOptions, {
    message: 'Status is required',
  }),
  ...employeeBaseSchema,
  employeeActive: z.boolean(),
});

export type CreateUserFormSchemaValues = z.infer<typeof createUserSchema>;
export type UpdateUserFormSchemaValues = z.infer<typeof updateUserSchema>;
