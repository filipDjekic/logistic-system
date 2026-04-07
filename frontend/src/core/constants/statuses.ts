import { formatStatusLabel } from '../utils/formatStatusLabel';

export type StatusTone =
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'primary';

export type StatusConfig = {
  label: string;
  tone: StatusTone;
};

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  // TaskStatus
  NEW: { label: 'New', tone: 'info' },
  IN_PROGRESS: { label: 'In Progress', tone: 'primary' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'error' },

  // TransportOrderStatus
  CREATED: { label: 'Created', tone: 'info' },
  ASSIGNED: { label: 'Assigned', tone: 'warning' },
  IN_TRANSIT: { label: 'In Transit', tone: 'primary' },
  DELIVERED: { label: 'Delivered', tone: 'success' },

  // VehicleStatus
  AVAILABLE: { label: 'Available', tone: 'success' },
  IN_USE: { label: 'In Use', tone: 'primary' },
  MAINTENANCE: { label: 'Maintenance', tone: 'warning' },
  OUT_OF_SERVICE: { label: 'Out Of Service', tone: 'error' },

  // WarehouseStatus
  ACTIVE: { label: 'Active', tone: 'success' },
  INACTIVE: { label: 'Inactive', tone: 'neutral' },
  FULL: { label: 'Full', tone: 'warning' },
  UNDER_MAINTENANCE: { label: 'Under Maintenance', tone: 'warning' },

  // ShiftStatus
  PLANNED: { label: 'Planned', tone: 'info' },
  FINISHED: { label: 'Finished', tone: 'success' },

  // UserStatus
  BLOCKED: { label: 'Blocked', tone: 'error' },

  // NotificationStatus
  UNREAD: { label: 'Unread', tone: 'info' },
  READ: { label: 'Read', tone: 'neutral' },

  // NotificationType
  INFO: { label: 'Info', tone: 'info' },
  WARNING: { label: 'Warning', tone: 'warning' },
  ERROR: { label: 'Error', tone: 'error' },
  SUCCESS: { label: 'Success', tone: 'success' },

  // PriorityLevel / TaskPriority
  LOW: { label: 'Low', tone: 'neutral' },
  MEDIUM: { label: 'Medium', tone: 'info' },
  HIGH: { label: 'High', tone: 'warning' },
  URGENT: { label: 'Urgent', tone: 'error' },

  // ChangeType
  CREATE: { label: 'Create', tone: 'success' },
  UPDATE: { label: 'Update', tone: 'info' },
  DELETE: { label: 'Delete', tone: 'error' },
  STATUS_CHANGE: { label: 'Status Change', tone: 'primary' },

  // StockMovementType
  INBOUND: { label: 'Inbound', tone: 'success' },
  OUTBOUND: { label: 'Outbound', tone: 'warning' },
  TRANSFER_IN: { label: 'Transfer In', tone: 'info' },
  TRANSFER_OUT: { label: 'Transfer Out', tone: 'primary' },
  ADJUSTMENT: { label: 'Adjustment', tone: 'neutral' },

  // Derived inventory UI status
  LOW_STOCK: { label: 'Low Stock', tone: 'warning' },
  SUFFICIENT: { label: 'Sufficient', tone: 'success' },
};

export function getStatusConfig(value: string): StatusConfig {
  return STATUS_CONFIG[value] ?? { label: formatStatusLabel(value), tone: 'neutral' };
}