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
};