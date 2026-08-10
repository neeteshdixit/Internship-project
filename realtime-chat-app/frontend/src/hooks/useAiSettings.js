import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiFetch';

// ─── QUERY KEYS ───────────────────────────────────────────────────────────────
export const AI_SETTINGS_KEY = ['aiSettings'];
export const AI_TRANSPARENCY_KEY = ['aiTransparency'];

// ─── HOOKS ────────────────────────────────────────────────────────────────────

/**
 * AI settings — almost never changes mid-session.
 * Cache for 10 minutes.
 */
export const useAiSettings = (enabled = true) => {
  return useQuery({
    queryKey: AI_SETTINGS_KEY,
    queryFn: () => apiFetch('/api/ai/settings'),
    enabled: Boolean(enabled),
    staleTime: 10 * 60 * 1000,  // 10 minutes
    gcTime: 30 * 60 * 1000,      // 30 minutes in cache
  });
};

/**
 * AI transparency / status data — what models are active, privacy info.
 * Cache for 5 minutes.
 */
export const useAiTransparency = (enabled = true) => {
  return useQuery({
    queryKey: AI_TRANSPARENCY_KEY,
    queryFn: () => apiFetch('/api/ai/status'),
    enabled: Boolean(enabled),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

/**
 * Save AI settings mutation.
 * Invalidates both AI settings and transparency cache.
 */
export const useSaveAiSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settings) =>
      apiFetch('/api/ai/settings', {
        method: 'POST',
        body: JSON.stringify(settings),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AI_SETTINGS_KEY });
      queryClient.invalidateQueries({ queryKey: AI_TRANSPARENCY_KEY });
    },
  });
};

/**
 * Run an AI feature (summarize, translate, grammar, etc.)
 * Not cached — always fresh since it depends on conversation content.
 */
export const useRunAiFeature = () => {
  return useMutation({
    mutationFn: ({ endpoint, body }) =>
      apiFetch(`/api/ai/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  });
};

/**
 * AI conversational chat mutation.
 * Not cached — always fresh since it's a real-time conversation.
 */
export const useAiChat = () => {
  return useMutation({
    mutationFn: ({ message, historyStr }) =>
      apiFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ text: message, param: historyStr }),
      }),
  });
};

/**
 * Scheduled messages hooks.
 */
export const SCHEDULED_MESSAGES_KEY = ['scheduledMessages'];

export const useScheduledMessages = (enabled = true) => {
  return useQuery({
    queryKey: SCHEDULED_MESSAGES_KEY,
    queryFn: () => apiFetch('/api/messages/schedule'),
    enabled: Boolean(enabled),
    staleTime: 30 * 1000,        // 30 seconds (time-sensitive)
    gcTime: 2 * 60 * 1000,
  });
};

export const useScheduleMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ receiverUsername, content, scheduledTime }) =>
      apiFetch('/api/messages/schedule', {
        method: 'POST',
        body: JSON.stringify({ receiverUsername, content, scheduledTime }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCHEDULED_MESSAGES_KEY }),
  });
};

export const useDeleteScheduledMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiFetch(`/api/messages/schedule/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: SCHEDULED_MESSAGES_KEY }),
  });
};

/**
 * Update user profile mutation.
 */
export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async ({ profileUsername, profileEmail, profilePhone, profilePic, profileAbout, token }) => {
      let finalProfilePicUrl = profilePic;

      // If base64 image — upload first
      if (profilePic && profilePic.startsWith('data:image')) {
        const res = await fetch(profilePic);
        const blob = await res.blob();
        const file = new File([blob], 'profile.png', { type: blob.type });
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch('http://localhost:8081/api/users/profile-image', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        if (!uploadRes.ok) {
          const uploadErr = await uploadRes.json();
          throw new Error(uploadErr.error || 'Failed to upload profile image');
        }
        const uploadData = await uploadRes.json();
        finalProfilePicUrl = uploadData.profilePicUrl;
      }

      const profileRes = await apiFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ username: profileUsername, email: profileEmail, phoneNumber: profilePhone, profilePicUrl: finalProfilePicUrl }),
      });

      let updatedAbout = profileAbout;
      try {
        const aboutRes = await apiFetch('/api/users/about', {
          method: 'PUT',
          body: JSON.stringify({ about: profileAbout }),
        });
        if (aboutRes?.about) updatedAbout = aboutRes.about;
      } catch (e) {}

      return { ...profileRes, about: updatedAbout };
    },
  });
};

/**
 * Upload chat media file mutation.
 */
export const useUploadChatMedia = () => {
  return useMutation({
    mutationFn: async ({ file, token }) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://localhost:8081/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to upload file');
      }
      return res.json();
    },
  });
};
