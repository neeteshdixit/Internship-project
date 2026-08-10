import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiFetch';

// ─── QUERY KEYS ───────────────────────────────────────────────────────────────
export const ANALYTICS_KEYS = {
  peer: (peerName) => ['analytics', peerName],
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * Conversation analytics — cached aggressively for 5 minutes.
 * This is a heavy DB query on the backend, so we cache it hard.
 *
 * @param {string} peerName - The contact's username to load analytics for
 * @param {boolean} enabled - Whether the query should run
 */
export const useAnalytics = (peerName, enabled = true) => {
  return useQuery({
    queryKey: ANALYTICS_KEYS.peer(peerName),
    queryFn: () => apiFetch(`/api/analytics/${peerName}`),
    enabled: Boolean(enabled && peerName),
    staleTime: 5 * 60 * 1000,   // 5 minutes — analytics don't change in real time
    gcTime: 10 * 60 * 1000,      // 10 minutes in cache
  });
};
