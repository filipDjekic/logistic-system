import { createBrowserRouter, Navigate } from 'react-router-dom';
import StarterPage from './StarterPage';
import LoginPage from '../../features/auth/pages/LoginPage';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import NotificationsPage from '../../features/notifications/pages/NotificationsPage';
import ShiftsPage from '../../features/shifts/pages/ShiftsPage';
import MyShiftsPage from '../../features/shifts/pages/MyShiftsPage';
import TransportOrdersPage from '../../features/transport-orders/pages/TransportOrdersPage';
import TransportOrderDetailsPage from '../../features/transport-orders/pages/TransportOrderDetailsPage';
import VehiclesPage from '../../features/vehicles/pages/VehiclesPage';
import VehicleDetailsPage from '../../features/vehicles/pages/VehicleDetailsPage';
import InventoryPage from '../../features/inventory/pages/InventoryPage';
import InventoryDetailsPage from '../../features/inventory/pages/InventoryDetailsPage';
import StockMovementsPage from '../../features/stock-movements/pages/StockMovementsPage';
import EmployeesPage from '../../features/employees/pages/EmployeesPage';
import EmployeeDetailsPage from '../../features/employees/pages/EmployeeDetailsPage';
import UsersPage from '../../features/users/pages/UsersPage';
import UserDetailsPage from '../../features/users/pages/UserDetailsPage';
import { GuestRoute, ProtectedRoute } from './guards';
import { ALL_ROLES, ROLES } from '../../core/constants/roles';
import AuthLayout from '../layout/AuthLayout';
import AppLayout from '../layout/AppLayout';

export const routes = [
  {
    element: <GuestRoute redirectTo="/dashboard" />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: '/',
            element: <StarterPage />,
          },
          {
            path: '/login',
            element: <LoginPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={ALL_ROLES} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/notifications',
            element: <NotificationsPage />,
          },
          {
            path: '/my-shifts',
            element: <MyShiftsPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/shifts',
            element: <ShiftsPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/transport-orders',
            element: <TransportOrdersPage />,
          },
          {
            path: '/transport-orders/:id',
            element: <TransportOrderDetailsPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/transport-orders',
            element: <TransportOrdersPage />,
          },
          {
            path: '/transport-orders/:id',
            element: <TransportOrderDetailsPage />,
          },
          {
            path: '/vehicles',
            element: <VehiclesPage />,
          },
          {
            path: '/vehicles/:id',
            element: <VehicleDetailsPage />,
          },
                    {
            path: '/inventory',
            element: <InventoryPage />,
          },
          {
            path: '/inventory/:warehouseId/:productId',
            element: <InventoryDetailsPage />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
  {
    path: '/stock-movements',
    element: <StockMovementsPage />,
  },
  {
    path: '/employees',
    element: <EmployeesPage />,
  },
  {
    path: '/employees/:id',
    element: <EmployeeDetailsPage />,
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR_MANAGER]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/users',
            element: <UsersPage />,
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRoles={[ROLES.ADMIN]} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/users/:id',
            element: <UserDetailsPage />,
          },
        ],
      },
    ],
  },
];

export const appRouter = createBrowserRouter(routes);