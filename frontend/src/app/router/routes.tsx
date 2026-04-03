import { createBrowserRouter, Navigate } from 'react-router-dom';
import StarterPage from './StarterPage';
import LoginPage from '../../features/auth/pages/LoginPage';

export const routes = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <StarterPage />,
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
];

export const appRouter = createBrowserRouter(routes);