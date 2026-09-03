import { ROLES, type Role } from '../constants/roles';

export const CAPABILITIES = {
  STOCK_MOVEMENT_READ: 'stockMovement.read',
  STOCK_MOVEMENT_CREATE: 'stockMovement.create',
  STOCK_MOVEMENT_EXECUTE: 'stockMovement.execute',
  STOCK_MOVEMENT_APPROVE: 'stockMovement.approve',
  SHIFT_SICKNESS_CANCEL: 'shift.sicknessCancel',
  SHIFT_READ_ALL: 'shift.readAll',
  SHIFT_MANAGE: 'shift.manage',
  TRANSPORT_MANAGE: 'transport.manage',
  VEHICLE_MANAGE: 'vehicle.manage',
  TASK_CREATE: 'task.create',
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

export type PermissionScope = 'GLOBAL' | 'COMPANY' | 'MANAGED_WAREHOUSES' | 'ASSIGNED_WAREHOUSES' | 'TRANSPORT_RELATED' | 'ASSIGNED_TO_ME' | 'DRIVERS_ONLY' | 'CONTEXTUAL_ONLY';

export const ROLE_SCOPES: Record<Role, Readonly<Record<string, PermissionScope>>> = {
  [ROLES.OVERLORD]: { default: 'GLOBAL' },
  [ROLES.COMPANY_ADMIN]: { default: 'COMPANY' },
  [ROLES.HR_MANAGER]: { employees: 'COMPANY', shifts: 'COMPANY', tasks: 'COMPANY' },
  [ROLES.WAREHOUSE_MANAGER]: { transportOrders: 'COMPANY', tasks: 'MANAGED_WAREHOUSES', employees: 'MANAGED_WAREHOUSES', shifts: 'MANAGED_WAREHOUSES', stockMovements: 'MANAGED_WAREHOUSES', inventory: 'MANAGED_WAREHOUSES' },
  [ROLES.DISPATCHER]: { transportOrders: 'COMPANY', employees: 'DRIVERS_ONLY', shifts: 'DRIVERS_ONLY', stockMovements: 'TRANSPORT_RELATED' },
  [ROLES.DRIVER]: { transportOrders: 'ASSIGNED_TO_ME', tasks: 'ASSIGNED_TO_ME', vehicles: 'TRANSPORT_RELATED', referenceData: 'CONTEXTUAL_ONLY' },
  [ROLES.WORKER]: { transportOrders: 'ASSIGNED_TO_ME', tasks: 'ASSIGNED_TO_ME', stockMovements: 'ASSIGNED_WAREHOUSES', inventory: 'ASSIGNED_WAREHOUSES' },
};

export function getRoleScope(role: Role | null | undefined, domain: string): PermissionScope | null {
  if (!role) return null;
  return ROLE_SCOPES[role][domain] ?? ROLE_SCOPES[role].default ?? null;
}

const CAPABILITY_ROLES: Record<Capability, readonly Role[]> = {
  [CAPABILITIES.STOCK_MOVEMENT_READ]: [
    ROLES.OVERLORD,
    ROLES.COMPANY_ADMIN,
    ROLES.WAREHOUSE_MANAGER,
    ROLES.DISPATCHER,
    ROLES.DRIVER,
    ROLES.WORKER,
  ],
  [CAPABILITIES.STOCK_MOVEMENT_CREATE]: [ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER],
  [CAPABILITIES.STOCK_MOVEMENT_EXECUTE]: [
    ROLES.COMPANY_ADMIN,
    ROLES.WAREHOUSE_MANAGER,
    ROLES.DISPATCHER,
  ],
  [CAPABILITIES.STOCK_MOVEMENT_APPROVE]: [
    ROLES.COMPANY_ADMIN,
    ROLES.WAREHOUSE_MANAGER,
    ROLES.DISPATCHER,
  ],
  [CAPABILITIES.SHIFT_SICKNESS_CANCEL]: [
    ROLES.WAREHOUSE_MANAGER,
    ROLES.DISPATCHER,
    ROLES.DRIVER,
    ROLES.WORKER,
  ],
  [CAPABILITIES.SHIFT_READ_ALL]: [
    ROLES.OVERLORD,
    ROLES.COMPANY_ADMIN,
    ROLES.HR_MANAGER,
    ROLES.WAREHOUSE_MANAGER,
    ROLES.DISPATCHER,
  ],
  [CAPABILITIES.SHIFT_MANAGE]: [ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER],
  [CAPABILITIES.TRANSPORT_MANAGE]: [ROLES.COMPANY_ADMIN, ROLES.DISPATCHER],
  [CAPABILITIES.VEHICLE_MANAGE]: [ROLES.COMPANY_ADMIN, ROLES.DISPATCHER],
  [CAPABILITIES.TASK_CREATE]: [ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER],
};

export function hasCapability(role: Role | null | undefined, capability: Capability): boolean {
  return role != null && CAPABILITY_ROLES[capability].includes(role);
}

export function rolesForCapability(capability: Capability): readonly Role[] {
  return CAPABILITY_ROLES[capability];
}
