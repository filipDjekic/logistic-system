import { z } from 'zod';

const optionalTrimmedString = (max: number, message: string) =>
  z
    .string()
    .max(max, message)
    .transform((value) => value.trim())
    .optional()
    .or(z.literal(''));

const optionalId = z
  .union([z.string(), z.number()])
  .optional()
  .transform((value) => {
    if (value === undefined || value === null || value === '') {
      return '';
    }
    return String(value).trim();
  })
  .refine((value) => value === '' || /^\d+$/.test(value), 'Value must be a valid numeric id.');

export const profileChangeRequestSchema = z
  .object({
    phoneCode: optionalTrimmedString(10, 'Phone code can contain up to 10 characters.'),
    phoneNumber: optionalTrimmedString(30, 'Phone number can contain up to 30 characters.'),
    email: z
      .string()
      .trim()
      .optional()
      .or(z.literal(''))
      .refine((value) => !value || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value), 'Email is not valid.')
      .transform((value) => value?.toLowerCase() ?? ''),
    address: optionalTrimmedString(200, 'Address can contain up to 200 characters.'),
    postalCode: optionalTrimmedString(20, 'Postal code can contain up to 20 characters.'),
    cityId: optionalId,
    countryId: optionalId,
    timezoneId: optionalId,
    reason: optionalTrimmedString(1000, 'Reason can contain up to 1000 characters.'),
  })
  .superRefine((values, context) => {
    const hasRequestedChange = [
      values.phoneCode,
      values.phoneNumber,
      values.email,
      values.address,
      values.postalCode,
      values.cityId,
      values.countryId,
      values.timezoneId,
    ].some((value) => value !== undefined && value !== null && String(value).trim() !== '');

    if (!hasRequestedChange) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phoneNumber'],
        message: 'Enter at least one profile field to request a change.',
      });
    }
  });

export type ProfileChangeRequestFormValues = z.infer<typeof profileChangeRequestSchema>;
