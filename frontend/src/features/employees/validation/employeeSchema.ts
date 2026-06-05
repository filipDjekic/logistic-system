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
    .max(60, 'First name must be at most 60 characters'),
  lastName: z
    .string()
    .trim()
    .min(1, 'Last name is required')
    .max(60, 'Last name must be at most 60 characters'),
  jmbg: z
    .string()
    .trim()
    .min(1, 'JMBG is required')
    .max(13, 'JMBG must be at most 13 characters'),
  phoneNumber: z
    .string()
    .trim()
    .min(1, 'Phone number is required')
    .max(30, 'Phone number must be at most 30 characters'),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(255, 'Email must be at most 255 characters')
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
  companyId: z.string().trim(),
  applyGeneratedEmailSuggestion: z.boolean(),
  address: z.string().trim().max(200, 'Address must be at most 200 characters').optional().nullable(),
  countryId: z.coerce.number().positive('Country is required').optional().nullable(),
  city: z.string().trim().max(100, 'City must be at most 100 characters').optional().nullable(),
  postalCode: z.string().trim().max(20, 'Postal code must be at most 20 characters').optional().nullable(),
  cityId: z.coerce.number().positive('City is required').optional().nullable(),
  timezoneId: z.coerce.number().positive('Timezone is required').optional().nullable(),
  primaryWarehouseId: z.coerce.number().positive('Primary warehouse is not valid').optional().nullable(),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchemaBase>;

export function getEmployeeFormSchema(
  mode: 'create' | 'edit',
  hasLinkedUser: boolean,
  requireCompany: boolean,
) {
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

      if (requireCompany) {
        if (values.companyId.trim().length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['companyId'],
            message: 'Company is required',
          });
        } else if (Number.isNaN(Number(values.companyId)) || Number(values.companyId) <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['companyId'],
            message: 'Selected company is not valid',
          });
        }
      }
    }

    if (values.position === 'WORKER' && !values.primaryWarehouseId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['primaryWarehouseId'],
        message: 'Primary warehouse is required for WORKER',
      });
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