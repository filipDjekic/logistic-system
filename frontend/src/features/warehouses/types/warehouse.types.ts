export type WarehouseStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'FULL'
  | 'UNDER_MAINTENANCE';

export type WarehouseResponse = {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  status: WarehouseStatus;
  active: boolean;
  employeeId: number | null;
  managerName: string | null;
  companyId: number | null;
  companyName: string | null;
};

export type WarehouseEmployeeOption = {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  companyId: number | null;
};

export type WarehouseCreateRequest = {
  name: string;
  address: string;
  city: string;
  capacity: number;
  status: WarehouseStatus;
  employeeId: number;
  companyId?: number;
};

export type WarehouseUpdateRequest = {
  id?: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
};

export type WarehouseFiltersState = {
  search: string;
  status: WarehouseStatus | 'ALL';
  active: boolean | 'ALL';
};

export type WarehouseFilterParams = {
  search?: string;
  status?: WarehouseStatus;
  active?: boolean;
  managerId?: number;
};

export type WarehouseFormValues = {
  name: string;
  address: string;
  city: string;
  capacity: number | '';
  status: WarehouseStatus;
  employeeId: number | '';
  companyId: string;
};