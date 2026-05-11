export type VehicleStatus =
  | 'AVAILABLE'
  | 'RESERVED'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';

export const vehicleTypeOptions = [
  'VAN',
  'TRUCK',
  'BOX_TRUCK',
  'SEMI_TRUCK',
  'REFRIGERATED_TRUCK',
  'TANKER',
  'PICKUP',
  'FORKLIFT',
] as const;

export const fuelTypeOptions = [
  'DIESEL',
  'PETROL',
  'ELECTRIC',
  'HYBRID',
  'LPG',
  'CNG',
] as const;

export type VehicleBrandResponse = {
  id: number;
  name: string;
};

export type VehicleModelResponse = {
  id: number;
  brandId: number;
  brandName: string;
  name: string;
};

export type VehicleResponse = {
  id: number;
  registrationNumber: string;
  vehicleBrandId: number;
  brand: string;
  vehicleModelId: number;
  model: string;
  type: string;
  capacity: number;
  maxWeight: number;
  maxVolume?: number | null;
  maxItems?: number | null;
  fuelType: string;
  yearOfProduction: number;
  status: VehicleStatus;
  active?: boolean;
  companyId?: number | null;
  companyName?: string | null;
  hasActiveMaintenance?: boolean | null;
};

export type VehicleCreateRequest = {
  registrationNumber: string;
  vehicleModelId: number;
  type: string;
  capacity: number;
  maxWeight: number;
  maxVolume?: number | null;
  maxItems?: number | null;
  fuelType: string;
  yearOfProduction: number;
  status: VehicleStatus;
  companyId?: number;
};

export type VehicleUpdateRequest = {
  id?: number;
  registrationNumber: string;
  vehicleModelId: number;
  type: string;
  capacity: number;
  maxWeight: number;
  maxVolume?: number | null;
  maxItems?: number | null;
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
  vehicleBrandId: string;
  vehicleModelId: string;
  type: string;
  capacity: number | '';
  maxWeight: number | '';
  maxVolume: number | '';
  maxItems: number | '';
  fuelType: string;
  yearOfProduction: number | '';
  status: VehicleStatus;
  companyId: string;
};