package com.whatsappclone.service;

import com.whatsappclone.model.ChatGroup;
import com.whatsappclone.model.ConversationVanishMode;
import com.whatsappclone.model.User;
import com.whatsappclone.repo.ChatGroupRepository;
import com.whatsappclone.repo.ConversationVanishModeRepository;
import com.whatsappclone.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ConversationVanishModeService {

    private static final int VANISH_DURATION_SECONDS = 30;

    private final ConversationVanishModeRepository vanishModeRepository;
    private final UserRepository userRepository;
    private final ChatGroupRepository chatGroupRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Map<String, Object> getDirectState(String currentUsername, String peerUsername) {
        String conversationKey = buildDirectConversationKey(currentUsername, peerUsername);
        ConversationVanishMode state = getOrCreateState(conversationKey);
        return toResponseMap(state, null, peerUsername, null);
    }

    public Map<String, Object> getGroupState(String currentUsername, Long groupId) {
        ChatGroup group = getAuthorizedGroup(currentUsername, groupId);
        String conversationKey = buildGroupConversationKey(groupId);
        ConversationVanishMode state = getOrCreateState(conversationKey);
        return toResponseMap(state, groupId, null, null);
    }

    @Transactional
    public Map<String, Object> updateDirectState(String currentUsername, String peerUsername, boolean enabled) {
        String conversationKey = buildDirectConversationKey(currentUsername, peerUsername);
        ConversationVanishMode state = getOrCreateState(conversationKey);
        validateTogglePermission(state, currentUsername, enabled);

        state.setEnabled(enabled);
        state.setEnabledByUsername(enabled ? currentUsername : null);
        ConversationVanishMode saved = vanishModeRepository.save(state);
        broadcastDirectState(saved, currentUsername, peerUsername);
        return toResponseMap(saved, null, peerUsername, currentUsername);
    }

    @Transactional
    public Map<String, Object> updateGroupState(String currentUsername, Long groupId, boolean enabled) {
        ChatGroup group = getAuthorizedGroup(currentUsername, groupId);
        String conversationKey = buildGroupConversationKey(groupId);
        ConversationVanishMode state = getOrCreateState(conversationKey);
        validateTogglePermission(state, currentUsername, enabled);

        state.setEnabled(enabled);
        state.setEnabledByUsername(enabled ? currentUsername : null);
        ConversationVanishMode saved = vanishModeRepository.save(state);
        broadcastGroupState(saved, group, currentUsername);
        return toResponseMap(saved, groupId, null, currentUsername);
    }

    public Integer getAppliedDurationSeconds(String currentUsername, String peerUsername, Long groupId) {
        String conversationKey = groupId != null
                ? buildGroupConversationKey(groupId)
                : buildDirectConversationKey(currentUsername, peerUsername);
        ConversationVanishMode state = vanishModeRepository.findByConversationKey(conversationKey).orElse(null);
        return state != null && state.isEnabled() ? VANISH_DURATION_SECONDS : null;
    }

    public Map<String, Object> toResponseMap(ConversationVanishMode state, Long groupId, String peerUsername, String actorUsername) {
        Map<String, Object> response = new HashMap<>();
        response.put("conversationKey", state.getConversationKey());
        response.put("enabled", state.isEnabled());
        response.put("enabledByUsername", state.getEnabledByUsername());
        response.put("updatedAt", state.getUpdatedAt() != null ? state.getUpdatedAt().toString() : null);
        if (groupId != null) {
            response.put("groupId", groupId);
        }
        if (peerUsername != null) {
            response.put("peerUsername", peerUsername);
        }
        if (actorUsername != null) {
            response.put("actorUsername", actorUsername);
        }
        return response;
    }

    private ConversationVanishMode getOrCreateState(String conversationKey) {
        return vanishModeRepository.findByConversationKey(conversationKey)
                .orElseGet(() -> vanishModeRepository.save(
                        ConversationVanishMode.builder()
                                .conversationKey(conversationKey)
                                .enabled(false)
                                .enabledByUsername(null)
                                .build()
                ));
    }

    private void validateTogglePermission(ConversationVanishMode state, String currentUsername, boolean enabling) {
        if (!state.isEnabled()) {
            return;
        }

        String owner = normalize(state.getEnabledByUsername());
        String actor = normalize(currentUsername);
        if (owner.isEmpty()) {
            return;
        }

        if (!owner.equals(actor)) {
            if (enabling) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vanish mode is already enabled by " + state.getEnabledByUsername());
            }
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only " + state.getEnabledByUsername() + " can turn off vanish mode");
        }
    }

    private ChatGroup getAuthorizedGroup(String currentUsername, Long groupId) {
        if (groupId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Group id is required");
        }

        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Group not found"));
        User currentUser = userRepository.findByUsernameIgnoreCase(currentUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Current user not found"));

        boolean isMember = group.getMembers() != null && group.getMembers().stream()
                .anyMatch(member -> member != null && member.getUsername() != null && member.getUsername().equalsIgnoreCase(currentUser.getUsername()));
        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this group");
        }
        return group;
    }

    private void broadcastDirectState(ConversationVanishMode state, String currentUsername, String peerUsername) {
        Map<String, Object> payload = new HashMap<>(toResponseMap(state, null, peerUsername, currentUsername));
        payload.put("type", "VANISH_MODE_UPDATED");

        messagingTemplate.convertAndSend("/topic/messages/" + currentUsername, payload);
        if (peerUsername != null && !peerUsername.equalsIgnoreCase(currentUsername)) {
            messagingTemplate.convertAndSend("/topic/messages/" + peerUsername, payload);
        }
    }

    private void broadcastGroupState(ConversationVanishMode state, ChatGroup group, String currentUsername) {
        Map<String, Object> payload = new HashMap<>(toResponseMap(state, group.getId(), null, currentUsername));
        payload.put("type", "VANISH_MODE_UPDATED");

        if (group.getMembers() == null) {
            return;
        }

        for (User member : group.getMembers()) {
            if (member != null && member.getUsername() != null) {
                messagingTemplate.convertAndSend("/topic/messages/" + member.getUsername(), payload);
            }
        }
    }

    private String buildDirectConversationKey(String participantA, String participantB) {
        List<String> participants = new ArrayList<>();
        pushParticipant(participants, participantA);
        pushParticipant(participants, participantB);
        Collections.sort(participants);
        return participants.isEmpty() ? "" : "direct:" + String.join("|", participants);
    }

    private String buildGroupConversationKey(Long groupId) {
        return "group:" + groupId;
    }

    private void pushParticipant(List<String> participants, String value) {
        String normalized = normalize(value);
        if (!normalized.isEmpty() && !participants.contains(normalized)) {
            participants.add(normalized);
        }
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
