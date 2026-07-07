import { z } from 'zod';

export const stockMovementTypeOptions = [
  'INBOUND',
  'OUTBOUND',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'ADJUSTMENT',
  'WRITE_OFF',
  'RETURN_IN',
  'RETURN_OUT',
] as const;


export const stockMovementStatusOptions = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'EXECUTED',
  'REJECTED',
  'CANCELLED',
  'REVERSED',
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

export const stockMovementDiscrepancyReasonOptions = ['SHORTAGE', 'OVERAGE', 'DAMAGE', 'PICKING_ERROR', 'RECEIVING_ERROR', 'TRANSPORT_LOSS', 'OTHER'] as const;

export const stockMovementReferenceTypeOptions = [
  'MANUAL',
  'TRANSPORT_ORDER',
  'INVENTORY_COUNT',
  'PURCHASE_DOCUMENT',
  'RETURN_DOCUMENT',
  'SYSTEM',
  'STOCK_MOVEMENT',
] as const;

export const stockMovementSchema = z
  .object({
    movementType: z.enum(stockMovementTypeOptions, {
      error: 'Movement type is required',
    }),
    quantity: z
      .number({ error: 'Quantity is required' })
      .positive('Quantity must be greater than 0'),
    expectedQuantity: z.number().positive('Expected quantity must be greater than 0').nullable().optional(),
    actualQuantity: z.number().positive('Actual quantity must be greater than 0').nullable().optional(),
    discrepancyReason: z.enum(stockMovementDiscrepancyReasonOptions).nullable().optional(),
    discrepancyNote: z.string().max(255, 'Discrepancy note must be at most 255 characters').optional().or(z.literal('')),
    unitCost: z.number().nonnegative('Unit cost cannot be negative').nullable().optional(),
    totalCost: z.number().nonnegative('Total cost cannot be negative').nullable().optional(),
    currency: z.string().length(3, 'Currency must be a 3-letter ISO code').nullable().optional().or(z.literal('')),
    batchLotNumber: z.string().max(100, 'Batch/lot number must be at most 100 characters').optional().or(z.literal('')),
    batchExpirationDate: z.string().optional().or(z.literal('')),
    serialNumbersText: z.string().max(2000, 'Serial numbers must be at most 2000 characters').optional().or(z.literal('')),
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
    const expectedQuantity = values.expectedQuantity ?? values.quantity;
    const actualQuantity = values.actualQuantity ?? values.quantity;
    const discrepancyQuantity = actualQuantity - expectedQuantity;

    if (discrepancyQuantity !== 0 && !values.discrepancyReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discrepancyReason'],
        message: 'Discrepancy reason is required',
      });
    }

    if (
      discrepancyQuantity !== 0 &&
      ['SHORTAGE', 'DAMAGE', 'TRANSPORT_LOSS'].includes(values.discrepancyReason ?? '') &&
      (!values.discrepancyNote || values.discrepancyNote.trim().length < 5)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discrepancyNote'],
        message: 'Shortage, damage or transport loss needs a meaningful note',
      });
    }


    const hasUnitCost = values.unitCost !== null && values.unitCost !== undefined;
    const hasTotalCost = values.totalCost !== null && values.totalCost !== undefined;
    const hasCurrency = Boolean(values.currency && values.currency.trim().length > 0);

    if ((hasUnitCost || hasTotalCost) && !hasCurrency) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['currency'],
        message: 'Currency is required when cost is entered',
      });
    }

    if (values.unitCost !== null && values.unitCost !== undefined && values.totalCost !== null && values.totalCost !== undefined) {
      const calculated = values.unitCost * values.quantity;
      const delta = Math.abs(calculated - values.totalCost);

      if (delta > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['totalCost'],
          message: 'Total cost should match unit cost multiplied by quantity',
        });
      }
    }

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


    if (values.movementType === 'WRITE_OFF' && values.reasonCode !== 'DAMAGE_WRITE_OFF') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reasonCode'],
        message: 'Write-off movement must use DAMAGE_WRITE_OFF reason code',
      });
    }

    if (values.movementType === 'RETURN_IN' && values.reasonCode !== 'RETURN_IN') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reasonCode'],
        message: 'Return-in movement must use RETURN_IN reason code',
      });
    }

    if (values.movementType === 'RETURN_OUT' && values.reasonCode !== 'RETURN_OUT') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['reasonCode'],
        message: 'Return-out movement must use RETURN_OUT reason code',
      });
    }
  });

export type StockMovementSchemaValues = z.infer<typeof stockMovementSchema>;