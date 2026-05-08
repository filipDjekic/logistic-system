import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).optional().nullable().or(z.literal(''));

export const companyRegistrationSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required').max(120),
  registrationNumber: optionalText(40),
  taxNumber: optionalText(40),
  companyEmail: z.string().trim().email('Company email is not valid').max(255).optional().or(z.literal('')),
  companyPhoneNumber: optionalText(30),
  countryId: z.coerce.number().positive('Country is required'),
  cityId: z.coerce.number().positive('City is required'),
  timezoneId: z.coerce.number().positive('Timezone is required'),
  address: optionalText(200),
  postalCode: optionalText(20),
  adminFirstName: z.string().trim().min(1, 'Admin first name is required').max(60),
  adminLastName: z.string().trim().min(1, 'Admin last name is required').max(60),
  adminEmail: z.string().trim().email('Admin email is not valid').max(255),
  adminPhoneNumber: z.string().trim().min(1, 'Admin phone number is required').max(30),
  adminJmbg: z.string().trim().min(1, 'Admin JMBG is required').max(13),
  adminPassword: z.string().trim().min(8, 'Password must be at least 8 characters').max(255),
  adminEmploymentDate: z.string().trim().min(1, 'Admin employment date is required'),
  notes: optionalText(1000),
});

export type CompanyRegistrationSchemaValues = z.infer<typeof companyRegistrationSchema>;
