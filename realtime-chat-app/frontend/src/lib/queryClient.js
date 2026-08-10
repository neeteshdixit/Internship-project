import { QueryClient } from '@tanstack/react-query';

/**
 * Global QueryClient — smart cache settings per data type.
 *
 * staleTime  = data kitni der tak "fresh" maana jayega (no refetch in this window)
 * gcTime     = cache mein data kitni der tak rahega unused hone ke baad
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default: 1 minute fresh, 5 minute in cache
      staleTime: 1 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,  // Chat app mein jarurat nahi
    },
    mutations: {
      retry: 1,
    },
  },
});

export default queryClient;
