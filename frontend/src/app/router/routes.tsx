/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import AuthLayout from '../layout/AuthLayout';
import PageLoader from '../../shared/components/Loader/PageLoader';
import { GuestRoute, ProtectedRoute } from './guards';
import { ROLES } from '../../core/constants/roles';

const StarterPage = lazy(() => import('./StarterPage'));
const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage'));
const CompanyRegistrationPage = lazy(() => import('../../features/company-registration/pages/CompanyRegistrationPage'));
const CompanyRegistrationStatusPage = lazy(() => import('../../features/company-registration/pages/CompanyRegistrationStatusPage'));
const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage'));
const CompaniesPage = lazy(() => import('../../features/companies/pages/CompaniesPage'));
const CompanyRegistrationRequestsPage = lazy(() => import('../../features/company-registration/pages/CompanyRegistrationRequestsPage'));
const CompanyDetailsPage = lazy(() => import('../../features/companies/pages/CompanyDetailsPage'));
const NotificationsPage = lazy(() => import('../../features/notifications/pages/NotificationsPage'));
const ProfilePage = lazy(() => import('../../features/profile/pages/ProfilePage'));
const EmployeeProfileChangeRequestsPage = lazy(() => import('../../features/employee-profile-change-requests/pages/EmployeeProfileChangeRequestsPage'));
const ActivityLogsPage = lazy(() => import('../../features/activity-logs/pages/ActivityLogsPage'));
const ChangeHistoryPage = lazy(() => import('../../features/change-history/pages/ChangeHistoryPage'));
const ActivityTimelinePage = lazy(() => import('../../features/activity-timeline/pages/ActivityTimelinePage'));
const RolesPage = lazy(() => import('../../features/roles/pages/RolesPage'));
const RoleDetailsPage = lazy(() => import('../../features/roles/pages/RoleDetailsPage'));
const UsersPage = lazy(() => import('../../features/users/pages/UsersPage'));
const UserDetailsPage = lazy(() => import('../../features/users/pages/UserDetailsPage'));
const EmployeesPage = lazy(() => import('../../features/employees/pages/EmployeesPage'));
const EmployeeDetailsPage = lazy(() => import('../../features/employees/pages/EmployeeDetailsPage'));
const ShiftsPage = lazy(() => import('../../features/shifts/pages/ShiftsPage'));
const ShiftDetailsPage = lazy(() => import('../../features/shifts/pages/ShiftDetailsPage'));
const MyShiftsPage = lazy(() => import('../../features/shifts/pages/MyShiftsPage'));
const TransportOrdersPage = lazy(() => import('../../features/transport-orders/pages/TransportOrdersPage'));
const TransportOrderCreatePage = lazy(() => import('../../features/transport-orders/pages/TransportOrderCreatePage'));
const TransportOrderEditPage = lazy(() => import('../../features/transport-orders/pages/TransportOrderEditPage'));
const TransportOrderDetailsPage = lazy(() => import('../../features/transport-orders/pages/TransportOrderDetailsPage'));
const VehiclesPage = lazy(() => import('../../features/vehicles/pages/VehiclesPage'));
const VehicleDetailsPage = lazy(() => import('../../features/vehicles/pages/VehicleDetailsPage'));
const WarehousesPage = lazy(() => import('../../features/warehouses/pages/WarehousesPage'));
const WarehouseCreatePage = lazy(() => import('../../features/warehouses/pages/WarehouseCreatePage'));
const WarehouseEditPage = lazy(() => import('../../features/warehouses/pages/WarehouseEditPage'));
const WarehouseDetailsPage = lazy(() => import('../../features/warehouses/pages/WarehouseDetailsPage'));
const ZoneDetailsPage = lazy(() => import('../../features/warehouse-locations/pages/ZoneDetailsPage'));
const BinDetailsPage = lazy(() => import('../../features/warehouse-locations/pages/BinDetailsPage'));
const ProductsPage = lazy(() => import('../../features/product/pages/ProductsPage'));
const ProductDetailsPage = lazy(() => import('../../features/product/pages/ProductDetailsPage'));
const InventoryPage = lazy(() => import('../../features/inventory/pages/InventoryPage'));
const InventoryCreatePage = lazy(() => import('../../features/inventory/pages/InventoryCreatePage'));
const InventoryEditPage = lazy(() => import('../../features/inventory/pages/InventoryEditPage'));
const InventoryDetailsPage = lazy(() => import('../../features/inventory/pages/InventoryDetailsPage'));
const InventoryCountsPage = lazy(() => import('../../features/inventory-counts/pages/InventoryCountsPage'));
const InventoryCountDetailsPage = lazy(() => import('../../features/inventory-counts/pages/InventoryCountDetailsPage'));
const StockMovementsPage = lazy(() => import('../../features/stock-movements/pages/StockMovementsPage'));
const StockMovementDetailsPage = lazy(() => import('../../features/stock-movements/pages/StockMovementDetailsPage'));
const StockOperationPage = lazy(() => import('../../features/stock-movements/pages/StockOperationPage'));
const TasksPage = lazy(() => import('../../features/tasks/pages/TasksPage'));
const TaskCreatePage = lazy(() => import('../../features/tasks/pages/TaskCreatePage'));
const TaskEditPage = lazy(() => import('../../features/tasks/pages/TaskEditPage'));
const TaskDetailsPage = lazy(() => import('../../features/tasks/pages/TaskDetailsPage'));
const TransportReportPage = lazy(() => import('../../features/reports/pages/TransportReportPage'));
const InventoryReportPage = lazy(() => import('../../features/reports/pages/InventoryReportPage'));
const EmployeeTaskReportPage = lazy(() => import('../../features/reports/pages/EmployeeTaskReportPage'));

function lazyPage(page: ReactNode) {
  return <Suspense fallback={<PageLoader message="Loading page..." />}>{page}</Suspense>;
}

export const routes = [
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/', element: lazyPage(<StarterPage />) },
          { path: '/login', element: lazyPage(<LoginPage />) },
          { path: '/register-company', element: lazyPage(<CompanyRegistrationPage />) },
          { path: '/register-company/status/:requestId', element: lazyPage(<CompanyRegistrationStatusPage />) },
        ],
      },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: lazyPage(<DashboardPage />) },
          { path: '/notifications', element: lazyPage(<NotificationsPage />) },
          { path: '/profile', element: lazyPage(<ProfilePage />) },
          { path: '/my-shifts', element: lazyPage(<MyShiftsPage />) },
          { path: '/shifts/:id', element: lazyPage(<ShiftDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/companies', element: lazyPage(<CompaniesPage />) },
          { path: '/company-registration-requests', element: lazyPage(<CompanyRegistrationRequestsPage />) },
          { path: '/companies/:id', element: lazyPage(<CompanyDetailsPage />) },
          { path: '/activity-logs', element: lazyPage(<ActivityLogsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER, ROLES.DRIVER, ROLES.WORKER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/change-history', element: lazyPage(<ChangeHistoryPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/roles', element: lazyPage(<RolesPage />) },
          { path: '/roles/:id', element: lazyPage(<RoleDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/users', element: lazyPage(<UsersPage />) },
          { path: '/users/:id', element: lazyPage(<UserDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/employee-profile-change-requests', element: lazyPage(<EmployeeProfileChangeRequestsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.HR_MANAGER, ROLES.DISPATCHER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/shifts', element: lazyPage(<ShiftsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/employees', element: lazyPage(<EmployeesPage />) },
          { path: '/employees/:id', element: lazyPage(<EmployeeDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER, ROLES.WAREHOUSE_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.WAREHOUSE_MANAGER, ROLES.DRIVER, ROLES.WORKER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/transport-orders', element: lazyPage(<TransportOrdersPage />) },
          { path: '/transport-orders/:id', element: lazyPage(<TransportOrderDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.DISPATCHER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/transport-orders/create', element: lazyPage(<TransportOrderCreatePage />) },
          { path: '/transport-orders/:id/edit', element: lazyPage(<TransportOrderEditPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.WAREHOUSE_MANAGER, ROLES.DRIVER, ROLES.WORKER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/tasks', element: lazyPage(<TasksPage />) },
          { path: '/tasks/:id', element: lazyPage(<TaskDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.WAREHOUSE_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/tasks/create', element: lazyPage(<TaskCreatePage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.DISPATCHER, ROLES.WAREHOUSE_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/tasks/:id/edit', element: lazyPage(<TaskEditPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.DRIVER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/vehicles', element: lazyPage(<VehiclesPage />) },
          { path: '/vehicles/:id', element: lazyPage(<VehicleDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER, ROLES.WORKER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/warehouse-locations', element: <Navigate to="/warehouses" replace /> },
          { path: '/warehouses/:warehouseId/zones', element: <Navigate to="/warehouses" replace /> },
          { path: '/warehouses/:warehouseId/zones/:zoneId', element: lazyPage(<ZoneDetailsPage />) },
          { path: '/warehouses/:warehouseId/zones/:zoneId/bins/:binId', element: lazyPage(<BinDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER, ROLES.WORKER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/warehouses', element: lazyPage(<WarehousesPage />) },
          { path: '/warehouses/:id', element: lazyPage(<WarehouseDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/products', element: lazyPage(<ProductsPage />) },
          { path: '/products/:id', element: lazyPage(<ProductDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER, ROLES.WORKER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/inventory', element: lazyPage(<InventoryPage />) },
          { path: '/inventory/:warehouseId/:productId', element: lazyPage(<InventoryDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.WAREHOUSE_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/inventory/create', element: lazyPage(<InventoryCreatePage />) },
          { path: '/inventory/:warehouseId/:productId/edit', element: lazyPage(<InventoryEditPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/warehouses/create', element: lazyPage(<WarehouseCreatePage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/warehouses/:id/edit', element: lazyPage(<WarehouseEditPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER, ROLES.WORKER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/stock-movements', element: lazyPage(<StockMovementsPage />) },
          { path: '/stock-movements/:id', element: lazyPage(<StockMovementDetailsPage />) },
          { path: '/inventory-counts', element: lazyPage(<InventoryCountsPage />) },
          { path: '/inventory-counts/:id', element: lazyPage(<InventoryCountDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.WAREHOUSE_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/stock-movements/create', element: lazyPage(<StockOperationPage />) }],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.WAREHOUSE_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/reports/transport', element: lazyPage(<TransportReportPage />) }],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/reports/inventory', element: lazyPage(<InventoryReportPage />) }],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/reports/employee-tasks', element: lazyPage(<EmployeeTaskReportPage />) }],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/activity-timeline', element: lazyPage(<ActivityTimelinePage />) },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export const router = createBrowserRouter(routes);
