import type { EmployeePosition } from '../../employees/types/employee.types';
import type { WarehouseStatus } from '../../warehouses/types/warehouse.types';

export type EmployeeWarehouseAccessType = 'PRIMARY' | 'WORKER' | 'MANAGER' | 'DISPATCH' | 'VIEW_ONLY';

export type EmployeeWarehouseAssignmentResponse = {
  id: number;
  companyId: number;
  companyName: string | null;
  employeeId: number;
  employeeName: string | null;
  employeePosition: EmployeePosition | null;
  warehouseId: number;
  warehouseName: string | null;
  warehouseStatus: WarehouseStatus | null;
  accessType: EmployeeWarehouseAccessType;
  active: boolean;
  validFrom: string | null;
  validTo: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type EmployeeWarehouseAssignmentCreateRequest = {
  employeeId: number;
  warehouseId: number;
  accessType: EmployeeWarehouseAccessType;
  active?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  notes?: string | null;
};

export type EmployeeWarehouseAssignmentUpdateRequest = {
  accessType?: EmployeeWarehouseAccessType;
  active?: boolean;
  validFrom?: string | null;
  validTo?: string | null;
  notes?: string | null;
};
