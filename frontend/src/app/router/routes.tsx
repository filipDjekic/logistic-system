import { createBrowserRouter, Navigate } from 'react-router-dom';
import StarterPage from './StarterPage';
import LoginPage from '../../features/auth/pages/LoginPage';
import DashboardPage from '../../features/dashboard/pages/DashboardPage';
import NotificationsPage from '../../features/notifications/pages/NotificationsPage';
import { GuestRoute, ProtectedRoute } from './guards';
import { ALL_ROLES } from '../../core/constants/roles';
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