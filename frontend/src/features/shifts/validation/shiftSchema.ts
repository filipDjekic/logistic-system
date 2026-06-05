import { z } from 'zod';

export const shiftStatusOptions = [
  'PLANNED',
  'ACTIVE',
  'FINISHED',
  'CANCELLED',
] as const;

export const shiftSchema = z
  .object({
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    notes: z
      .string()
      .max(255, 'Notes must be at most 255 characters'),
    timezoneId: z.union([
      z.number().positive('Timezone is required'),
      z.literal(''),
    ]),
    employeeId: z
      .union([
        z.number().positive('Employee is required'),
        z.literal(''),
      ]),
    warehouseId: z
      .union([
        z.number().positive('Warehouse must be a positive number'),
        z.literal(''),
      ])
      .optional(),
  })
  .superRefine((values, context) => {
    if (!values.startTime || !values.endTime) {
      return;
    }

    const start = new Date(values.startTime);
    const end = new Date(values.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return;
    }

    if (end <= start) {
      context.addIssue({
        code: 'custom',
        path: ['endTime'],
        message: 'End time must be after start time',
      });
    }
  });

export type ShiftSchemaValues = z.infer<typeof shiftSchema>;
