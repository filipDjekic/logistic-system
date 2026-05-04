export type WarehouseStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'FULL'
  | 'UNDER_MAINTENANCE';

export type WarehouseLocationFields = {
  postalCode: string | null;
  cityId: number | null;
  cityName: string | null;
  countryId: number | null;
  countryCode: string | null;
  countryName: string | null;
  timezoneId: number | null;
  timezoneName: string | null;
  timezoneDisplayName: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type WarehouseResponse = WarehouseLocationFields & {
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
  cityId: number;
  city?: string | null;
  postalCode?: string | null;
  countryId?: number | null;
  timezoneId: number;
  latitude?: number | null;
  longitude?: number | null;
  capacity: number;
  status: WarehouseStatus;
  employeeId: number;
  companyId?: number;
};

export type WarehouseUpdateRequest = {
  id?: number;
  name: string;
  address: string;
  cityId: number;
  city?: string | null;
  postalCode?: string | null;
  countryId?: number | null;
  timezoneId: number;
  latitude?: number | null;
  longitude?: number | null;
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
  cityId: number | '';
  city?: string | null;
  postalCode?: string | null;
  countryId?: number | null;
  timezoneId: number | '';
  latitude?: number | null;
  longitude?: number | null;
  capacity: number | '';
  status: WarehouseStatus;
  employeeId: number | '';
  companyId: string;
};
