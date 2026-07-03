import type { StockMovementResponse, StockMovementStatus } from '../types/stockMovement.types';

export const stockMovementLifecycleOrder: StockMovementStatus[] = [
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'EXECUTED',
  'REJECTED',
  'CANCELLED',
  'REVERSED',
];

export type StockMovementLifecycleAction = 'approve' | 'reject' | 'execute' | 'cancel' | 'reverse';

type LifecycleActionDefinition = {
  key: StockMovementLifecycleAction;
  targetStatus: StockMovementStatus;
  label: string;
  description: string;
  confirmTitle: string;
  confirmDescription: (movement: StockMovementResponse) => string;
  color: 'primary' | 'error' | 'warning' | 'success';
  variant: 'contained' | 'outlined';
  requiresApprovalRole?: boolean;
  requiresExecutionRole?: boolean;
  requiresReversalRole?: boolean;
};

export const stockMovementLifecycleActions: LifecycleActionDefinition[] = [
  {
    key: 'approve',
    targetStatus: 'APPROVED',
    label: 'Approve',
    description: 'Approve a pending movement so it can be executed.',
    confirmTitle: 'Approve stock movement',
    confirmDescription: (movement) => `Approve stock movement #${movement.id}. This does not change stock yet; it only allows execution.`,
    color: 'success',
    variant: 'contained',
    requiresApprovalRole: true,
  },
  {
    key: 'reject',
    targetStatus: 'REJECTED',
    label: 'Reject',
    description: 'Reject a pending movement before it affects inventory.',
    confirmTitle: 'Reject stock movement',
    confirmDescription: (movement) => `Reject stock movement #${movement.id}. The movement will remain in history without inventory effects.`,
    color: 'error',
    variant: 'outlined',
    requiresApprovalRole: true,
  },
  {
    key: 'execute',
    targetStatus: 'EXECUTED',
    label: 'Execute',
    description: 'Apply the movement to stock quantities.',
    confirmTitle: 'Execute stock movement',
    confirmDescription: (movement) => `Execute stock movement #${movement.id}. This applies the inventory effect for ${movement.quantity} units of ${movement.productName}.`,
    color: 'primary',
    variant: 'contained',
    requiresExecutionRole: true,
  },
  {
    key: 'cancel',
    targetStatus: 'CANCELLED',
    label: 'Cancel',
    description: 'Cancel a movement that has not been executed.',
    confirmTitle: 'Cancel stock movement',
    confirmDescription: (movement) => `Cancel stock movement #${movement.id}. No inventory effect will be applied.`,
    color: 'error',
    variant: 'outlined',
    requiresExecutionRole: true,
  },
  {
    key: 'reverse',
    targetStatus: 'REVERSED',
    label: 'Reverse',
    description: 'Create a counter movement that restores stock balance.',
    confirmTitle: 'Reverse stock movement',
    confirmDescription: (movement) => `Reverse executed stock movement #${movement.id}. The system will create and execute a counter movement.`,
    color: 'warning',
    variant: 'outlined',
    requiresReversalRole: true,
  },
];

export function normalizeStockMovementStatus(status: string | null | undefined): StockMovementStatus {
  return stockMovementLifecycleOrder.includes(status as StockMovementStatus)
    ? status as StockMovementStatus
    : 'EXECUTED';
}

export function canUseLifecycleAction(
  action: LifecycleActionDefinition,
  allowedNextStatuses: string[],
  options: { canApprove: boolean; canExecute: boolean; canReverse?: boolean; movement?: StockMovementResponse | null },
) {
  if (!allowedNextStatuses.includes(action.targetStatus)) {
    return false;
  }

  if (action.requiresApprovalRole && !options.canApprove) {
    return false;
  }

  if (action.requiresExecutionRole && !options.canExecute) {
    return false;
  }

  if (action.requiresReversalRole && !options.canReverse) {
    return false;
  }

  if (action.key === 'reverse' && (options.movement?.reversedByMovementId || options.movement?.reversalOfMovementId)) {
    return false;
  }

  return true;
}
