import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { subscribeSessionExpired } from './authEvents';

export function useSessionExpiredRedirect(): void {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    return subscribeSessionExpired(() => {
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    });
  }, [location.pathname, navigate]);
}
