import { z } from 'zod';

export const taskPriorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .or(z.literal('')),
  dueDate: z
    .string()
    .min(1, 'Due date is required'),
  priority: z.enum(taskPriorityOptions, {
    error: 'Priority is required',
  }),
  assignedEmployeeId: z
    .number({ error: 'Assigned employee is required' })
    .positive('Assigned employee is required'),
  transportOrderId: z
    .number()
    .positive('Transport order must be a positive number')
    .nullable()
    .optional(),
});

export type TaskSchemaValues = z.infer<typeof taskSchema>;