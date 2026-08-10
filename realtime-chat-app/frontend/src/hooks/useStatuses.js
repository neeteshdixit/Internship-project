import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiFetch';

// ─── QUERY KEYS ───────────────────────────────────────────────────────────────
export const STATUS_KEYS = {
  all: ['statuses'],
};

// ─── HOOK ─────────────────────────────────────────────────────────────────────

/**
 * Statuses / Stories — fresh for 1 minute, cached for 3 minutes.
 */
export const useStatuses = (currentUser, enabled = true) => {
  return useQuery({
    queryKey: STATUS_KEYS.all,
    queryFn: async () => {
      const data = await apiFetch('/api/statuses');

      const mine = data.find((g) => g.username === currentUser?.username);
      const others = data.filter((g) => g.username !== currentUser?.username);

      const myStatuses = mine
        ? mine.updates.map((u) => ({
            id: u.id, name: mine.username, avatar: mine.avatar,
            time: u.createdAt, image: u.mediaUrl, caption: u.caption,
            type: u.type, textBackground: u.textBackground,
          }))
        : [];

      const friendStatuses = others.map((o) => ({
        username: o.username, avatar: o.avatar,
        updates: o.updates.map((u) => ({
          id: u.id, name: o.username, avatar: o.avatar,
          time: u.createdAt, image: u.mediaUrl, caption: u.caption,
          type: u.type, textBackground: u.textBackground,
        })),
      }));

      return { myStatuses, friendStatuses };
    },
    enabled: Boolean(enabled && currentUser?.username),
    staleTime: 1 * 60 * 1000,   // 1 minute
    gcTime: 3 * 60 * 1000,       // 3 minutes in cache
  });
};

/**
 * Post a new status.
 * Invalidates statuses cache on success.
 */
export const usePostStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ mediaUrl, caption, type, textBackground }) =>
      apiFetch('/api/statuses', {
        method: 'POST',
        body: JSON.stringify({ mediaUrl, caption, type, textBackground }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STATUS_KEYS.all });
    },
  });
};
