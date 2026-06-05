import { QueryClient } from '@tanstack/react-query';
import { cacheTimes, garbageCollectionTimes } from '../constants/cache';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;

        if (status && status >= 400 && status < 500) {
          return false;
        }

        return failureCount < 2;
      },
      gcTime: garbageCollectionTimes.standard,
      refetchOnMount: false,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      staleTime: cacheTimes.standard,
    },
    mutations: {
      retry: false,
    },
  },
});

export function clearQueryCache() {
  queryClient.clear();
}
