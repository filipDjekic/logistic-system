import { z } from 'zod';

function slugifySegment(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function normalizeUsernamePart(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

export function buildBootstrapAdminPreview(companyName: string, firstName: string, lastName: string) {
  const first = normalizeUsernamePart(firstName) || 'admin';
  const last = normalizeUsernamePart(lastName) || 'user';
  const username = `${first}.${last}`.replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
  const companySegment = slugifySegment(companyName) || 'company';
  const positionSegment = 'manager';

  return {
    role: 'COMPANY_ADMIN' as const,
    status: 'ACTIVE' as const,
    position: 'COMPANY_ADMIN' as const,
    username,
    email: `${username}@${companySegment}.${positionSegment}.rs`,
  };
}

export const companySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Company name is required')
    .max(120, 'Company name must be at most 120 characters'),
  active: z.boolean(),

  adminFirstName: z.string().trim().min(1, 'First name is required').max(60),
  adminLastName: z.string().trim().min(1, 'Last name is required').max(60),
  adminPassword: z
    .string()
    .trim()
    .min(8, 'Password must be at least 8 characters')
    .max(255),

  adminJmbg: z.string().trim().min(1, 'JMBG is required').max(13),
  adminPhoneNumber: z.string().trim().min(1, 'Phone number is required').max(20),
  adminEmploymentDate: z.string().trim().min(1, 'Employment date is required'),
});

export type CompanySchemaValues = z.infer<typeof companySchema>;