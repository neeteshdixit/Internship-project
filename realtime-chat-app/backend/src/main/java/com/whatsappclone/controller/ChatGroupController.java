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
        List<String> members = (List<String>) request.get("members");

        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Group name is required"));
        }

        ChatGroup group = chatGroupService.createGroup(name, avatar, principal.getName(), members);
        return ResponseEntity.ok(group);
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
                .build()
        ).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}
