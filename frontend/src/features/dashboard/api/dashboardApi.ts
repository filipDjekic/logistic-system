import { apiClient } from '../../../core/api/client';

export type OverlordRecentActivityResponse = {
  id: number;
  action: string;
  entityName: string;
  entityId: number | null;
  entityIdentifier: string | null;
  description: string | null;
  createdAt: string;
  userId: number | null;
  userEmail: string | null;
};

export type OverlordDashboardResponse = {
  companiesTotal: number;
  activeCompanies: number;
  usersTotal: number;
  usersByStatus: Record<string, number>;
  employeesTotal: number;
  activeEmployees: number;
  transportOrdersTotal: number;
  transportOrdersByStatus: Record<string, number>;
  tasksTotal: number;
  tasksByStatus: Record<string, number>;
  vehiclesTotal: number;
  vehiclesByStatus: Record<string, number>;
  warehousesTotal: number;
  productsTotal: number;
  inventoryRowsTotal: number;
  lowStockRowsTotal: number;
  inventoryQuantityTotal: string;
  inventoryAvailableQuantityTotal: string;
  stockMovementsTotal: number;
  activityLogsTotal: number;
  changeHistoryTotal: number;
  recentActivities: OverlordRecentActivityResponse[];
};

export const dashboardApi = {
  getOverlordDashboard() {
    return apiClient
      .get<OverlordDashboardResponse>('/api/dashboard/overlord')
      .then((response) => response.data);
  },
};