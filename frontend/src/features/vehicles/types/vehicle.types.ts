export type VehicleStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export type VehicleResponse = {
  id: number;
  registrationNumber: string;
  brand: string;
  model: string;
  type: string;
  capacity: number;
  fuelType: string;
  yearOfProduction: number;
  status: VehicleStatus;
  active?: boolean;
  companyId?: number | null;
  companyName?: string | null;
};

export type VehicleCreateRequest = {
  registrationNumber: string;
  brand: string;
  model: string;
  type: string;
  capacity: number;
  fuelType: string;
  yearOfProduction: number;
  status: VehicleStatus;
  companyId?: number;
};

export type VehicleUpdateRequest = {
  id?: number;
  registrationNumber: string;
  brand: string;
  model: string;
  type: string;
  capacity: number;
  fuelType: string;
  yearOfProduction: number;
  status: VehicleStatus;
};

export type VehicleFiltersState = {
  search: string;
  status: VehicleStatus | 'ALL';
  type: string;
  available: 'ALL' | 'true' | 'false';
  capacityFrom: string;
  capacityTo: string;
};

export type VehicleSearchParams = {
  search?: string;
  status?: VehicleStatus;
  type?: string;
  available?: boolean;
  capacityFrom?: number;
  capacityTo?: number;
};

export type VehicleFormValues = {
  registrationNumber: string;
  brand: string;
  model: string;
  type: string;
  capacity: number | '';
  fuelType: string;
  yearOfProduction: number | '';
  status: VehicleStatus;
  companyId: string;
};
