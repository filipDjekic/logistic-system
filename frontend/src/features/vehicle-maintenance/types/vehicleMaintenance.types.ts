export type VehicleMaintenanceStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type VehicleMaintenanceType =
  | 'ROUTINE_SERVICE'
  | 'REPAIR'
  | 'INSPECTION'
  | 'TIRE_CHANGE'
  | 'OIL_CHANGE'
  | 'CLEANING'
  | 'OTHER';

export type VehicleMaintenanceResponse = {
  id: number;
  vehicleId: number;
  vehicleRegistrationNumber: string;
  companyId: number;
  companyName: string;
  type: VehicleMaintenanceType;
  status: VehicleMaintenanceStatus;
  scheduledAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
  odometer?: number | null;
  cost?: number | null;
  notes?: string | null;
  cancelReason?: string | null;
  activeMaintenance: boolean;
  createdAt: string;
  updatedAt?: string | null;
};

export type VehicleMaintenanceCreateRequest = {
  vehicleId: number;
  type: VehicleMaintenanceType;
  scheduledAt: string;
  odometer?: number | null;
  cost?: number | null;
  notes?: string | null;
};

export type VehicleMaintenanceUpdateRequest = {
  type: VehicleMaintenanceType;
  scheduledAt: string;
  odometer?: number | null;
  cost?: number | null;
  notes?: string | null;
};

export type DriverWorkloadResponse = {
  employeeId: number;
  driverName: string;
  dailyDrivingHours: number;
  weeklyDrivingHours: number;
  maxDailyDrivingHours: number;
  maxWeeklyDrivingHours: number;
  dailyLimitExceeded: boolean;
  weeklyLimitExceeded: boolean;
  assignable: boolean;
};

export type VehicleMaintenanceFilters = {
  vehicleId?: number;
  status?: VehicleMaintenanceStatus;
};
