import { ROLES, type Role } from '../constants/roles';

export const CAPABILITIES = {
  STOCK_MOVEMENT_READ: 'stockMovement.read',
  STOCK_MOVEMENT_CREATE: 'stockMovement.create',
  STOCK_MOVEMENT_EXECUTE: 'stockMovement.execute',
  STOCK_MOVEMENT_APPROVE: 'stockMovement.approve',
  SHIFT_SICKNESS_CANCEL: 'shift.sicknessCancel',
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

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
};

export function hasCapability(role: Role | null | undefined, capability: Capability): boolean {
  return role != null && CAPABILITY_ROLES[capability].includes(role);
}

export function rolesForCapability(capability: Capability): readonly Role[] {
  return CAPABILITY_ROLES[capability];
}
