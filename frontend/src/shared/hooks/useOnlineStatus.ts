import { useEffect, useState } from 'react';

export function useOnlineStatus() {
  const getInitialStatus = () => (typeof navigator === 'undefined' ? true : navigator.onLine);
  const [online, setOnline] = useState<boolean>(getInitialStatus);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}
