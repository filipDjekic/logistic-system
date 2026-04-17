import { z } from 'zod';

export const employeePositionOptions = [
  'OVERLORD',
  'COMPANY_ADMIN',
  'HR_MANAGER',
  'DISPATCHER',
  'DRIVER',
  'WAREHOUSE_MANAGER',
  'WORKER',
] as const;

export const userStatusOptions = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;

const employeeFormSchemaBase = z.object({
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
    .max(50, 'Email must be at most 50 characters')
    .email('Email is not valid'),
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
  password: z.string().trim(),
  status: z.enum(userStatusOptions),
  enabled: z.boolean(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchemaBase>;

export function getEmployeeFormSchema(mode: 'create' | 'edit', hasLinkedUser: boolean) {
  return employeeFormSchemaBase.superRefine((values, ctx) => {
    if (mode === 'create') {
      if (values.password.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Password is required',
        });
      } else if (values.password.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['password'],
          message: 'Password must be at least 8 characters',
        });
      }
    }

    if (!hasLinkedUser && mode === 'edit' && values.password.length > 0 && values.password.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['password'],
        message: 'Password must be at least 8 characters',
      });
    }
  });
}
