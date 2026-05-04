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

export function buildBootstrapAdminPreview(
  companyName: string,
  firstName: string,
  lastName: string,
  countryCode?: string | null,
) {
  const first = normalizeUsernamePart(firstName) || 'admin';
  const last = normalizeUsernamePart(lastName) || 'user';
  const username = `${first}.${last}`.replace(/\.+/g, '.').replace(/^\.|\.$/g, '');
  const companySegment = slugifySegment(companyName) || 'company';
  const positionSegment = 'company-admin';
  const countrySegment = slugifySegment(countryCode ?? '') || 'country';

  return {
    role: 'COMPANY_ADMIN' as const,
    status: 'ACTIVE' as const,
    position: 'COMPANY_ADMIN' as const,
    username,
    email: `${username}@${companySegment}.${positionSegment}.${countrySegment}`,
  };
}

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();

export const companySchema = z.object({
  name: z.string().trim().min(1, 'Company name is required').max(120),
  active: z.boolean(),
  countryId: z.coerce.number().positive('Country is required'),
  timezoneId: z.coerce.number().positive('Timezone is required'),
  address: optionalText(200),
  cityId: z.coerce.number().positive('City is required'),
  city: optionalText(100),
  postalCode: optionalText(20),
  phoneNumber: optionalText(30),
  email: z.string().trim().email('Email is not valid').max(255).optional().or(z.literal('')),
  taxNumber: optionalText(40),
  registrationNumber: optionalText(40),

  adminFirstName: z.string().trim().min(1, 'First name is required').max(60),
  adminLastName: z.string().trim().min(1, 'Last name is required').max(60),
  adminPassword: z.string().trim().min(8, 'Password must be at least 8 characters').max(255),
  adminJmbg: z.string().trim().min(1, 'JMBG is required').max(13),
  adminPhoneNumber: z.string().trim().min(1, 'Phone number is required').max(30),
  adminEmploymentDate: z.string().trim().min(1, 'Employment date is required'),
});

export type CompanySchemaValues = z.infer<typeof companySchema>;
