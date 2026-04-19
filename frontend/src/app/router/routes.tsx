import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import AuthLayout from '../layout/AuthLayout';
import { GuestRoute, ProtectedRoute } from './guards';
import { ROLES } from '../../core/constants/roles';
import LoginPage from '../../features/auth/pages/LoginPage';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import CompaniesPage from '../../features/companies/pages/CompaniesPage';
import CompanyDetailsPage from '../../features/companies/pages/CompanyDetailsPage';
import NotificationsPage from '../../features/notifications/pages/NotificationsPage';
import ActivityLogsPage from '../../features/activity-logs/pages/ActivityLogsPage';
import ChangeHistoryPage from '../../features/change-history/pages/ChangeHistoryPage';
import RolesPage from '../../features/roles/pages/RolesPage';
import UsersPage from '../../features/users/pages/UsersPage';
import UserDetailsPage from '../../features/users/pages/UserDetailsPage';
import EmployeesPage from '../../features/employees/pages/EmployeesPage';
import EmployeeDetailsPage from '../../features/employees/pages/EmployeeDetailsPage';
import ShiftsPage from '../../features/shifts/pages/ShiftsPage';
import MyShiftsPage from '../../features/shifts/pages/MyShiftsPage';
import TransportOrdersPage from '../../features/transport-orders/pages/TransportOrdersPage';
import TransportOrderDetailsPage from '../../features/transport-orders/pages/TransportOrderDetailsPage';
import VehiclesPage from '../../features/vehicles/pages/VehiclesPage';
import VehicleDetailsPage from '../../features/vehicles/pages/VehicleDetailsPage';
import WarehousesPage from '../../features/warehouses/pages/WarehousesPage';
import WarehouseDetailsPage from '../../features/warehouses/pages/WarehouseDetailsPage';
import ProductsPage from '../../features/product/pages/ProductsPage';
import ProductDetailsPage from '../../features/product/pages/ProductDetailsPage';
import InventoryPage from '../../features/inventory/pages/InventoryPage';
import InventoryDetailsPage from '../../features/inventory/pages/InventoryDetailsPage';
import StockMovementsPage from '../../features/stock-movements/pages/StockMovementsPage';
import TasksPage from '../../features/tasks/pages/TasksPage';
import TaskDetailsPage from '../../features/tasks/pages/TaskDetailsPage';
import StarterPage from './StarterPage';

export const routes = [
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/', element: <StarterPage /> },
          { path: '/login', element: <LoginPage /> },
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
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          { path: '/my-shifts', element: <MyShiftsPage /> },
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
          { path: '/companies', element: <CompaniesPage /> },
          { path: '/companies/:id', element: <CompanyDetailsPage /> },
          { path: '/roles', element: <RolesPage /> },
          { path: '/activity-logs', element: <ActivityLogsPage /> },
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
          { path: '/users', element: <UsersPage /> },
          { path: '/users/:id', element: <UserDetailsPage /> },
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
          { path: '/employees', element: <EmployeesPage /> },
          { path: '/employees/:id', element: <EmployeeDetailsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.HR_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/shifts', element: <ShiftsPage /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.DISPATCHER, ROLES.WAREHOUSE_MANAGER, ROLES.DRIVER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/transport-orders', element: <TransportOrdersPage /> },
          { path: '/transport-orders/:id', element: <TransportOrderDetailsPage /> },
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
          { path: '/tasks', element: <TasksPage /> },
          { path: '/tasks/:id', element: <TaskDetailsPage /> },
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
          { path: '/vehicles', element: <VehiclesPage /> },
          { path: '/vehicles/:id', element: <VehicleDetailsPage /> },
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
          { path: '/warehouses', element: <WarehousesPage /> },
          { path: '/warehouses/:id', element: <WarehouseDetailsPage /> },
          { path: '/products', element: <ProductsPage /> },
          { path: '/products/:id', element: <ProductDetailsPage /> },
          { path: '/inventory', element: <InventoryPage /> },
          { path: '/inventory/:warehouseId/:productId', element: <InventoryDetailsPage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.WAREHOUSE_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/stock-movements', element: <StockMovementsPage /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN]} />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/change-history', element: <ChangeHistoryPage /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.OVERLORD, ROLES.COMPANY_ADMIN, ROLES.HR_MANAGER, ROLES.WAREHOUSE_MANAGER, ROLES.DISPATCHER, ROLES.DRIVER, ROLES.WORKER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/my-shifts', element: <MyShiftsPage /> }],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export const router = createBrowserRouter(routes);