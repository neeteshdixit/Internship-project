package com.whatsappclone.controller;

import com.whatsappclone.model.ChatGroup;
import com.whatsappclone.model.Message;
import com.whatsappclone.model.User;
import com.whatsappclone.service.ChatGroupService;
import com.whatsappclone.service.MessageService;
import com.whatsappclone.dto.MessageResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
public class ChatGroupController {

    private final ChatGroupService chatGroupService;
    private final MessageService messageService;
    private final com.whatsappclone.repo.MessageRepository messageRepository;

    @PostMapping
    public ResponseEntity<?> createGroup(@RequestBody Map<String, Object> request, Principal principal) {
        String name = (String) request.get("name");
        String avatar = (String) request.get("avatar");
        @SuppressWarnings("unchecked")
        List<?> members = (List<?>) request.get("members");
        if (members == null) {
            members = (List<?>) request.get("memberIds");
        }

        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Group name is required"));
        }

        ChatGroup group = chatGroupService.createGroup(name, avatar, principal.getName(), members);
        return ResponseEntity.ok(group);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGroupDetails(@PathVariable Long id, Principal principal) {
        try {
            Map<String, Object> details = chatGroupService.getGroupDetails(id, principal.getName());
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<?> getGroupMembers(@PathVariable Long id, Principal principal) {
        try {
            Map<String, Object> details = chatGroupService.getGroupDetails(id, principal.getName());
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/members")
    public ResponseEntity<?> addMembers(@PathVariable Long id, @RequestBody Map<String, Object> request, Principal principal) {
        try {
            @SuppressWarnings("unchecked")
            List<?> members = (List<?>) request.get("members");
            if (members == null) {
                members = (List<?>) request.get("memberIds");
            }
            if (members == null && request.get("username") != null) {
                members = List.of(request.get("username"));
            }
            if (members == null || members.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No members provided"));
            }
            Map<String, Object> details = chatGroupService.addMembers(id, members, principal.getName());
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/members/{identifier}")
    public ResponseEntity<?> removeMember(@PathVariable Long id, @PathVariable String identifier, Principal principal) {
        try {
            Map<String, Object> details = chatGroupService.removeMember(id, identifier, principal.getName());
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<?> leaveGroup(@PathVariable Long id, Principal principal) {
        try {
            chatGroupService.leaveGroup(id, principal.getName());
            return ResponseEntity.ok(Map.of("success", true, "message", "Left group successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/settings")
    public ResponseEntity<?> updateGroupSettings(@PathVariable Long id, @RequestBody Map<String, Object> settings, Principal principal) {
        try {
            Map<String, Object> details = chatGroupService.updateGroupSettings(id, settings, principal.getName());
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/admins")
    public ResponseEntity<?> promoteToAdmin(@PathVariable Long id, @RequestBody Map<String, Object> request, Principal principal) {
        try {
            Object memberId = request.get("memberId");
            if (memberId == null) memberId = request.get("username");
            if (memberId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Member identifier required"));
            }
            Map<String, Object> details = chatGroupService.promoteToAdmin(id, memberId, principal.getName());
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}/admins/{identifier}")
    public ResponseEntity<?> demoteFromAdmin(@PathVariable Long id, @PathVariable String identifier, Principal principal) {
        try {
            Map<String, Object> details = chatGroupService.demoteFromAdmin(id, identifier, principal.getName());
            return ResponseEntity.ok(details);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<ChatGroup>> getGroups(Principal principal) {
        List<ChatGroup> groups = chatGroupService.getGroupsForUser(principal.getName());
        for (ChatGroup g : groups) {
            Message lastMsg = messageRepository.findLastGroupMessage(g.getId());
            if (lastMsg != null) {
                g.setLastMessage(lastMsg.getContent());
                g.setLastMessageTimestamp(lastMsg.getTimestamp().toString());
            }
            // Migrate legacy groups: if admins is empty, treat createdBy as admin
            if (g.getAdmins().isEmpty() && g.getCreatedBy() != null) {
                g.getAdmins().add(g.getCreatedBy());
            }
        }
        return ResponseEntity.ok(groups);
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<List<MessageResponseDto>> getGroupMessages(@PathVariable Long id) {
        List<Message> messages = messageService.getGroupChatHistory(id);
        List<MessageResponseDto> dtos = messages.stream().map(msg -> MessageResponseDto.builder()
                .id(msg.getId())
                .senderUsername(msg.getSender().getUsername())
                .content(msg.getContent())
                .timestamp(msg.getTimestamp())
                .status(msg.getStatus())
                .parentMessageId(msg.getParentMessageId())
                .parentMessageText(msg.getParentMessageText())
                .parentMessageSender(msg.getParentMessageSender())
                .isForwarded(msg.isForwarded())
                .isStarred(msg.isStarred())
                .isPinned(msg.isPinned())
                .reactions(msg.getReactions())
                .isMedia(msg.isMedia())
                .mediaUrl(msg.getMediaUrl())
                .mediaType(msg.getMediaType())
                .fileName(msg.getFileName())
                .fileSize(msg.getFileSize())
                .messageType(msg.getMessageType())
                .groupId(id)
                .groupName(msg.getGroup() != null ? msg.getGroup().getName() : null)
                .iv(msg.getIv())
                .selfDestructSeconds(msg.getSelfDestructSeconds())
                .expiresAt(msg.getExpiresAt())
                .readAt(msg.getReadAt())
                .isPriority(msg.isPriority())
                .build()
        ).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
