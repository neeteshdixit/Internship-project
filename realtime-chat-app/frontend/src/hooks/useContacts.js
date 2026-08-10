import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/apiFetch';

// ─── QUERY KEYS ───────────────────────────────────────────────────────────────
export const CONTACTS_KEYS = {
  all: ['contacts'],
  partners: (username) => ['contacts', 'partners', username],
};

// ─── FETCHERS ─────────────────────────────────────────────────────────────────
const fetchSavedContacts = () => apiFetch('/api/contacts');
const fetchPartners = (username) => apiFetch(`/api/messages/partners/${username}`);
const fetchGroups = () => apiFetch('/api/groups');

// ─── HOOKS ────────────────────────────────────────────────────────────────────

/**
 * Contacts list — merged from saved contacts + message partners + groups.
 * staleTime: 2 minutes — contacts don't change that frequently.
 */
export const useContacts = (currentUser, enabled = true) => {
  return useQuery({
    queryKey: CONTACTS_KEYS.all,
    queryFn: async () => {
      const [savedContacts, partners, rawGroups] = await Promise.allSettled([
        fetchSavedContacts(),
        fetchPartners(currentUser.username),
        fetchGroups(),
      ]);

      const contactsList = savedContacts.status === 'fulfilled' ? savedContacts.value : [];
      const partnersList = partners.status === 'fulfilled' ? partners.value : [];
      const groupsList = rawGroups.status === 'fulfilled' ? rawGroups.value : [];

      // Merge contacts + partners
      const mergedMap = new Map();

      contactsList.forEach((c) => {
        const partnerInfo = partnersList.find((p) => p.id === c.contactUserId);
        const lastMsgArr = partnerInfo?.lastMessage
          ? [{
              id: `last-${c.contactUserId}`,
              text: partnerInfo.lastMessage,
              sender: partnerInfo.lastMessageSender === currentUser.username ? 'me' : 'other',
              timestamp: partnerInfo.lastMessageTimestamp
                ? new Date(partnerInfo.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '',
              messageType: partnerInfo.lastMessageType || 'TEXT',
              callType: partnerInfo.lastCallType,
              callStatus: partnerInfo.lastCallStatus,
              callDuration: partnerInfo.lastCallDuration,
            }]
          : [];

        mergedMap.set(c.contactUserId, {
          id: c.contactUserId, contactRecordId: c.id, username: c.name,
          name: c.customName || c.name, avatar: c.avatar, phoneNumber: c.phoneNumber,
          statusText: 'Offline', isOnline: false, messages: lastMsgArr,
          isFavorite: c.favorite, isBlocked: c.blocked, isPinned: c.pinned,
          isArchived: c.archived, isMuted: c.muted, label: c.label || 'NONE',
        });
      });

      partnersList.forEach((u) => {
        if (!mergedMap.has(u.id)) {
          const lastMsgArr = u.lastMessage
            ? [{
                id: `last-${u.id}`, text: u.lastMessage,
                sender: u.lastMessageSender === currentUser.username ? 'me' : 'other',
                timestamp: u.lastMessageTimestamp ? new Date(u.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                messageType: u.lastMessageType || 'TEXT',
                callType: u.lastCallType, callStatus: u.lastCallStatus, callDuration: u.lastCallDuration,
              }]
            : [];
          mergedMap.set(u.id, {
            id: u.id, contactRecordId: null, username: u.username, name: u.username,
            avatar: u.profilePicUrl, phoneNumber: u.phoneNumber,
            statusText: 'Offline', isOnline: false, messages: lastMsgArr,
            isFavorite: false, isBlocked: false, isPinned: false, isArchived: false, isMuted: false, label: 'NONE',
          });
        }
      });

      const userGroups = groupsList.map((g) => ({
        id: `group-${g.id}`, groupId: g.id, name: g.name, username: `group-${g.id}`,
        avatar: g.avatar || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=100',
        statusText: g.members.map((m) => m.username).join(', '),
        isOnline: true, isGroup: true, createdBy: g.createdBy, members: g.members,
        messages: g.lastMessage
          ? [{ id: `last-g-${g.id}`, text: g.lastMessage, sender: 'other', timestamp: g.lastMessageTimestamp ? new Date(g.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' }]
          : [],
        isFavorite: false, isBlocked: false, isPinned: false, isArchived: false, isMuted: false, label: 'NONE',
      }));

      const aiBot = {
        id: 9999, username: 'Ollama AI Assistant', name: 'Ollama AI Assistant',
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=100',
        statusText: 'Active AI Bot', isOnline: true, isAi: true,
        messages: [{ id: 1, text: 'Hello! Main local Ollama assistant hoon.', sender: 'ai', timestamp: '10:00 AM', status: 'read' }],
        isFavorite: false, isBlocked: false, isPinned: false, isArchived: false, isMuted: false, label: 'NONE',
      };

      const notesChat = {
        id: currentUser.id, username: currentUser.username,
        name: `${currentUser.username} (You / Notes)`, avatar: currentUser.profilePicUrl,
        phoneNumber: currentUser.phoneNumber, statusText: 'Personal Space', isOnline: true, isNotes: true,
        messages: [], isFavorite: true, isBlocked: false, isPinned: true, isArchived: false, isMuted: false, label: 'NONE',
      };

      return [notesChat, ...userGroups, ...Array.from(mergedMap.values()), aiBot];
    },
    enabled: Boolean(enabled && currentUser?.username),
    staleTime: 2 * 60 * 1000,   // 2 minutes
    gcTime: 5 * 60 * 1000,       // 5 minutes in cache
  });
};

/**
 * Toggle boolean attribute on a contact (favorite/block/pin/archive/mute).
 * Optimistically updates cache.
 */
export const useToggleContactAttribute = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contact, attribute, recordId }) => {
      const payload = {};
      if (attribute === 'isFavorite') payload.favorite = !contact.isFavorite;
      if (attribute === 'isBlocked') payload.blocked = !contact.isBlocked;
      if (attribute === 'isPinned') payload.pinned = !contact.isPinned;
      if (attribute === 'isArchived') payload.archived = !contact.isArchived;
      if (attribute === 'isMuted') payload.muted = !contact.isMuted;

      return apiFetch(`/api/contacts/${recordId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
    onMutate: async ({ contact, attribute }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: CONTACTS_KEYS.all });
      const previous = queryClient.getQueryData(CONTACTS_KEYS.all);

      // Optimistic update
      queryClient.setQueryData(CONTACTS_KEYS.all, (old) =>
        old?.map((c) => c.id === contact.id ? { ...c, [attribute]: !c[attribute] } : c)
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      queryClient.setQueryData(CONTACTS_KEYS.all, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CONTACTS_KEYS.all });
    },
  });
};
