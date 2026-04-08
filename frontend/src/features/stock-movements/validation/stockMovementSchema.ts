import { z } from 'zod';

export const stockMovementTypeOptions = [
  'INBOUND',
  'OUTBOUND',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'ADJUSTMENT',
] as const;

export const stockMovementReasonCodeOptions = [
  'INITIAL_STOCK',
  'PURCHASE_RECEIPT',
  'MANUAL_INBOUND',
  'MANUAL_OUTBOUND',
  'TRANSPORT_DISPATCH',
  'TRANSPORT_RECEIPT',
  'INVENTORY_ADJUSTMENT',
  'DAMAGE_WRITE_OFF',
  'RETURN_IN',
  'RETURN_OUT',
  'CORRECTION',
] as const;

export const stockMovementReferenceTypeOptions = [
  'MANUAL',
  'TRANSPORT_ORDER',
  'INVENTORY_COUNT',
  'PURCHASE_DOCUMENT',
  'RETURN_DOCUMENT',
  'SYSTEM',
] as const;

export const stockMovementSchema = z
  .object({
    movementType: z.enum(stockMovementTypeOptions, {
      error: 'Movement type is required',
    }),
    quantity: z
      .number({ error: 'Quantity is required' })
      .positive('Quantity must be greater than 0'),
    reasonCode: z.enum(stockMovementReasonCodeOptions, {
      error: 'Reason code is required',
    }),
    reasonDescription: z
      .string()
      .max(255, 'Reason description must be at most 255 characters')
      .optional()
      .or(z.literal('')),
    referenceType: z.enum(stockMovementReferenceTypeOptions, {
      error: 'Reference type is required',
    }),
    referenceId: z
      .number()
      .positive('Reference ID must be a positive number')
      .nullable()
      .optional(),
    referenceNumber: z
      .string()
      .max(100, 'Reference number must be at most 100 characters')
      .optional()
      .or(z.literal('')),
    referenceNote: z
      .string()
      .max(255, 'Reference note must be at most 255 characters')
      .optional()
      .or(z.literal('')),
    transportOrderId: z
      .number()
      .positive('Transport order must be a positive number')
      .nullable()
      .optional(),
    warehouseId: z
      .number({ error: 'Warehouse is required' })
      .positive('Warehouse is required'),
    productId: z
      .number({ error: 'Product is required' })
      .positive('Product is required'),
  })
  .superRefine((values, ctx) => {
    if (values.movementType === 'ADJUSTMENT') {
      if (!values.referenceNote || values.referenceNote.trim().length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['referenceNote'],
          message: 'Adjustment must contain a meaningful reference note',
        });
      }

      if (
        values.reasonCode !== 'INVENTORY_ADJUSTMENT' &&
        values.reasonCode !== 'CORRECTION'
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reasonCode'],
          message: 'Invalid reason code for adjustment',
        });
      }
    }

    if (
      values.movementType === 'TRANSFER_IN' ||
      values.movementType === 'TRANSFER_OUT'
    ) {
      if (!values.transportOrderId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['transportOrderId'],
          message: 'Transport order is required for transfer movement',
        });
      }

      if (values.referenceType !== 'TRANSPORT_ORDER') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['referenceType'],
          message: 'Transfer movement must use TRANSPORT_ORDER reference type',
        });
      }

      if (
        values.reasonCode !== 'TRANSPORT_DISPATCH' &&
        values.reasonCode !== 'TRANSPORT_RECEIPT'
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reasonCode'],
          message: 'Invalid reason code for transport movement',
        });
      }
    }

    if (values.referenceNumber !== undefined && values.referenceNumber.trim() === '') {
      // backend dozvoljava null, ali ne blank string
    }

    if (values.reasonDescription !== undefined && values.reasonDescription.trim() === '') {
      // backend dozvoljava null, ali ne blank string
    }

    if (values.referenceNote !== undefined && values.referenceNote.trim() === '') {
      if (values.movementType !== 'ADJUSTMENT') {
        // backend dozvoljava null, ali ne blank string
      }
    }
  });

export type StockMovementSchemaValues = z.infer<typeof stockMovementSchema>;