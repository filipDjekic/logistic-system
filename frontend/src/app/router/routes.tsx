import { createBrowserRouter, Navigate } from 'react-router-dom';
import StarterPage from './StarterPage';
import LoginPage from '../../features/auth/pages/LoginPage';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import NotificationsPage from '../../features/notifications/pages/NotificationsPage';
import ShiftsPage from '../../features/shifts/pages/ShiftsPage';
import MyShiftsPage from '../../features/shifts/pages/MyShiftsPage';
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
    path: '*',
    element: <Navigate to="/" replace />,
  },
];

export const appRouter = createBrowserRouter(routes);