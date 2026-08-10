import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiFetch';

// ─── QUERY KEYS ───────────────────────────────────────────────────────────────
export const CALL_HISTORY_KEY = ['callHistory'];

// ─── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * Call history — fetched once, cached for 5 minutes.
 * WebSocket pushes new entries, so REST is only for initial load.
 */
export const useCallHistory = (enabled = true) => {
  return useQuery({
    queryKey: CALL_HISTORY_KEY,
    queryFn: () => apiFetch('/api/calls'),
    enabled: Boolean(enabled),
    staleTime: 5 * 60 * 1000,   // 5 minutes
    gcTime: 10 * 60 * 1000,      // 10 minutes in cache
  });
};

/**
 * Save a new call log to backend.
 * Invalidates call history cache on success.
 */
export const useSaveCallLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ receiverUsername, callType, status, durationSeconds }) =>
      apiFetch('/api/calls', {
        method: 'POST',
        body: JSON.stringify({ receiverUsername, callType, status, durationSeconds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALL_HISTORY_KEY });
    },
  });
};
