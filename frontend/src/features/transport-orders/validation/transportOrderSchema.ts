import { z } from 'zod';

export const transportOrderPriorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const transportOrderSchema = z
  .object({
    orderNumber: z
      .string()
      .min(1, 'Order number is required')
      .max(50, 'Order number must be at most 50 characters'),
    description: z
      .string()
      .min(1, 'Description is required')
      .max(500, 'Description must be at most 500 characters'),
    orderDate: z
      .string()
      .min(1, 'Order date is required'),
    departureTime: z
      .string()
      .min(1, 'Departure time is required'),
    plannedArrivalTime: z
      .string()
      .min(1, 'Planned arrival time is required'),
    priority: z.enum(transportOrderPriorityOptions, {
      error: 'Priority is required',
    }),
    notes: z
      .string()
      .max(255, 'Notes must be at most 255 characters')
      .optional()
      .or(z.literal('')),
    sourceWarehouseId: z
      .number({ error: 'Source warehouse is required' })
      .positive('Source warehouse is required'),
    destinationWarehouseId: z
      .number({ error: 'Destination warehouse is required' })
      .positive('Destination warehouse is required'),
    vehicleId: z
      .number({ error: 'Vehicle is required' })
      .positive('Vehicle is required'),
    assignedEmployeeId: z
      .number({ error: 'Driver is required' })
      .positive('Driver is required'),
  })
  .refine(
    (values) => values.sourceWarehouseId !== values.destinationWarehouseId,
    {
      path: ['destinationWarehouseId'],
      message: 'Source and destination warehouses must be different',
    },
  )
  .refine(
    (values) => new Date(values.departureTime).getTime() < new Date(values.plannedArrivalTime).getTime(),
    {
      path: ['plannedArrivalTime'],
      message: 'Departure time must be before planned arrival time',
    },
  );

export const transportOrderItemSchema = z.object({
  productId: z
    .number({ error: 'Product is required' })
    .positive('Product is required'),
  quantity: z
    .number({ error: 'Quantity is required' })
    .positive('Quantity must be greater than 0'),
  note: z
    .string()
    .max(255, 'Note must be at most 255 characters')
    .optional()
    .or(z.literal('')),
});

export type TransportOrderSchemaValues = z.infer<typeof transportOrderSchema>;
export type TransportOrderItemSchemaValues = z.infer<typeof transportOrderItemSchema>;