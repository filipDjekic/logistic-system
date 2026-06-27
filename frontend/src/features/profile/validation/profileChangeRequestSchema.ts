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
    firstName: optionalTrimmedString(100, 'First name can contain up to 100 characters.'),
    lastName: optionalTrimmedString(100, 'Last name can contain up to 100 characters.'),
    phoneNumber: optionalTrimmedString(30, 'Phone number can contain up to 30 characters.'),
    address: optionalTrimmedString(200, 'Address can contain up to 200 characters.'),
    cityId: optionalId,
    countryId: optionalId,
    reason: optionalTrimmedString(1000, 'Reason can contain up to 1000 characters.'),
  })
  .superRefine((values, context) => {
    const hasRequestedChange = [
      values.firstName,
      values.lastName,
      values.phoneNumber,
      values.address,
      values.cityId,
      values.countryId,
    ].some((value) => value !== undefined && value !== null && String(value).trim() !== '');

    if (!hasRequestedChange) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['firstName'],
        message: 'Enter at least one profile field to request a change.',
      });
    }
  });

export type ProfileChangeRequestFormValues = z.infer<typeof profileChangeRequestSchema>;
