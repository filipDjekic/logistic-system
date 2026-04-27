import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import AuthLayout from '../layout/AuthLayout';
import PageLoader from '../../shared/components/Loader/PageLoader';
import { GuestRoute, ProtectedRoute } from './guards';
import { ROLES } from '../../core/constants/roles';

const StarterPage = lazy(() => import('./StarterPage'));
const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('../../features/dashboard/pages/DashboardPage'));
const CompaniesPage = lazy(() => import('../../features/companies/pages/CompaniesPage'));
const CompanyDetailsPage = lazy(() => import('../../features/companies/pages/CompanyDetailsPage'));
const NotificationsPage = lazy(() => import('../../features/notifications/pages/NotificationsPage'));
const ActivityLogsPage = lazy(() => import('../../features/activity-logs/pages/ActivityLogsPage'));
const ChangeHistoryPage = lazy(() => import('../../features/change-history/pages/ChangeHistoryPage'));
const RolesPage = lazy(() => import('../../features/roles/pages/RolesPage'));
const RoleDetailsPage = lazy(() => import('../../features/roles/pages/RoleDetailsPage'));
const UsersPage = lazy(() => import('../../features/users/pages/UsersPage'));
const UserDetailsPage = lazy(() => import('../../features/users/pages/UserDetailsPage'));
const EmployeesPage = lazy(() => import('../../features/employees/pages/EmployeesPage'));
const EmployeeDetailsPage = lazy(() => import('../../features/employees/pages/EmployeeDetailsPage'));
const ShiftsPage = lazy(() => import('../../features/shifts/pages/ShiftsPage'));
const MyShiftsPage = lazy(() => import('../../features/shifts/pages/MyShiftsPage'));
const TransportOrdersPage = lazy(() => import('../../features/transport-orders/pages/TransportOrdersPage'));
const TransportOrderDetailsPage = lazy(() => import('../../features/transport-orders/pages/TransportOrderDetailsPage'));
const VehiclesPage = lazy(() => import('../../features/vehicles/pages/VehiclesPage'));
const VehicleDetailsPage = lazy(() => import('../../features/vehicles/pages/VehicleDetailsPage'));
const WarehousesPage = lazy(() => import('../../features/warehouses/pages/WarehousesPage'));
const WarehouseDetailsPage = lazy(() => import('../../features/warehouses/pages/WarehouseDetailsPage'));
const ProductsPage = lazy(() => import('../../features/product/pages/ProductsPage'));
const ProductDetailsPage = lazy(() => import('../../features/product/pages/ProductDetailsPage'));
const InventoryPage = lazy(() => import('../../features/inventory/pages/InventoryPage'));
const InventoryDetailsPage = lazy(() => import('../../features/inventory/pages/InventoryDetailsPage'));
const StockMovementsPage = lazy(() => import('../../features/stock-movements/pages/StockMovementsPage'));
const TasksPage = lazy(() => import('../../features/tasks/pages/TasksPage'));
const TaskDetailsPage = lazy(() => import('../../features/tasks/pages/TaskDetailsPage'));
const TransportReportPage = lazy(() => import('../../features/reports/pages/TransportReportPage'));
const InventoryReportPage = lazy(() => import('../../features/reports/pages/InventoryReportPage'));
const EmployeeTaskReportPage = lazy(() => import('../../features/reports/pages/EmployeeTaskReportPage'));
const DataExchangePage = lazy(() => import('../../features/data-exchange/pages/DataExchangePage'));

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
          { path: '/my-shifts', element: lazyPage(<MyShiftsPage />) },
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
          { path: '/companies/:id', element: lazyPage(<CompanyDetailsPage />) },
          { path: '/activity-logs', element: lazyPage(<ActivityLogsPage />) },
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
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.HR_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/users', element: lazyPage(<UsersPage />) },
          { path: '/users/:id', element: lazyPage(<UserDetailsPage />) },
          { path: '/shifts', element: lazyPage(<ShiftsPage />) },
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
          { path: '/employees', element: lazyPage(<EmployeesPage />) },
          { path: '/employees/:id', element: lazyPage(<EmployeeDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.WAREHOUSE_MANAGER, ROLES.DRIVER]} />,
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
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER]} />,
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
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/warehouses', element: lazyPage(<WarehousesPage />) },
          { path: '/warehouses/:id', element: lazyPage(<WarehouseDetailsPage />) },
          { path: '/products', element: lazyPage(<ProductsPage />) },
          { path: '/products/:id', element: lazyPage(<ProductDetailsPage />) },
          { path: '/inventory', element: lazyPage(<InventoryPage />) },
          { path: '/inventory/:warehouseId/:productId', element: lazyPage(<InventoryDetailsPage />) },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/stock-movements', element: lazyPage(<StockMovementsPage />) }],
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
        children: [{ path: '/data-exchange', element: lazyPage(<DataExchangePage />) }],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export const router = createBrowserRouter(routes);
