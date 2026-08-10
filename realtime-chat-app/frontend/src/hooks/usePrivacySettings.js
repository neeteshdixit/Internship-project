import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiFetch';

// ─── QUERY KEYS ───────────────────────────────────────────────────────────────
export const PRIVACY_KEY = ['privacySettings'];

// ─── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * Privacy settings — user almost never changes these mid-session.
 * Cache aggressively for 10 minutes.
 */
export const usePrivacySettings = (enabled = true) => {
  return useQuery({
    queryKey: PRIVACY_KEY,
    queryFn: () => apiFetch('/api/users/privacy'),
    enabled: Boolean(enabled),
    staleTime: 10 * 60 * 1000,  // 10 minutes
    gcTime: 30 * 60 * 1000,      // 30 minutes in cache
  });
};

/**
 * Save privacy settings mutation.
 * Optimistically updates cache and invalidates on settle.
 */
export const useSavePrivacySettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings) =>
      apiFetch('/api/users/privacy', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }),
    onMutate: async (newSettings) => {
      await queryClient.cancelQueries({ queryKey: PRIVACY_KEY });
      const previous = queryClient.getQueryData(PRIVACY_KEY);
      queryClient.setQueryData(PRIVACY_KEY, (old) => ({ ...old, ...newSettings }));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      queryClient.setQueryData(PRIVACY_KEY, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: PRIVACY_KEY });
    },
  });
};
