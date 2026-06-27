import type { ShiftResponse, ShiftStatus } from '../types/shift.types';

export const shiftLifecycleOrder: ShiftStatus[] = ['PLANNED', 'ACTIVE', 'FINISHED'];
export const shiftTerminalStatuses: ShiftStatus[] = ['FINISHED', 'CANCELLED'];

export function isShiftEditable(shift: Pick<ShiftResponse, 'status'> | null | undefined) {
  return shift?.status === 'PLANNED';
}

export function isShiftCancellable(shift: Pick<ShiftResponse, 'status'> | null | undefined) {
  return shift?.status === 'PLANNED';
}

export function getAllowedShiftTransitions(shift: Pick<ShiftResponse, 'status'> | null | undefined): ShiftStatus[] {
  if (!shift) return [];
  if (shift.status === 'PLANNED') return ['ACTIVE', 'CANCELLED'];
  if (shift.status === 'ACTIVE') return ['FINISHED'];
  return [];
}

export function getShiftLifecycleDescription(status: ShiftStatus) {
  switch (status) {
    case 'PLANNED': return 'Shift is scheduled and can still be edited or cancelled by HR before it starts.';
    case 'ACTIVE': return 'Shift has started. The record is read-only and will be finished automatically when the end time passes.';
    case 'FINISHED': return 'Shift is completed and terminal. It remains available for audit and reporting.';
    case 'CANCELLED': return 'Shift was cancelled before start and is terminal.';
    default: return 'Shift lifecycle state.';
  }
}
