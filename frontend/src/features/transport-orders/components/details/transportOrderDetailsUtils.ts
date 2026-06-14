import type { TransportOrderStatus } from '../../types/transportOrder.types';

export function formatWeight(value: number | null) {
  if (value == null) {
    return '—';
  }

  return `${value} kg`;
}

export function getStatusActionLabel(status: TransportOrderStatus) {
  switch (status) {
    case 'ASSIGNED':
      return 'Assign resources';
    case 'PICKING':
      return 'Start picking';
    case 'PACKING':
      return 'Start packing';
    case 'READY_FOR_LOADING':
      return 'Mark ready for loading';
    case 'LOADING':
      return 'Start loading';
    case 'IN_TRANSIT':
      return 'Start transport';
    case 'RETURNING':
      return 'Start return flow';
    case 'DELIVERED':
      return 'Complete transport';
    case 'FAILED':
      return 'Mark as failed';
    case 'CANCELLED':
      return 'Cancel transport';
    default:
      return `Set status to ${status}`;
  }
}
