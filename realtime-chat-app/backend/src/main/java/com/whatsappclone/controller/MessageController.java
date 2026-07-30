package com.whatsappclone.controller;

import com.whatsappclone.dto.MessageDto;
import com.whatsappclone.dto.MessageResponseDto;
import com.whatsappclone.dto.TypingSignalDto;
import com.whatsappclone.model.Message;
import com.whatsappclone.service.MessageService;
import com.whatsappclone.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final PresenceService presenceService;
    private final com.whatsappclone.repo.PrivacySettingsRepository privacySettingsRepository;
    private final com.whatsappclone.repo.UserRepository userRepository;
    private final com.whatsappclone.repo.MessageRepository messageRepository;

    // 1. WebSocket Handler: Receives and broadcasts real-time chat messages
    @MessageMapping("/chat")
    public void processMessage(@Payload MessageDto messageDto) {
        Message savedMessage = messageService.saveMessage(messageDto);

        MessageResponseDto response = MessageResponseDto.builder()
                .id(savedMessage.getId())
                .senderUsername(savedMessage.getSender().getUsername())
                .receiverUsername(savedMessage.getReceiver() != null ? savedMessage.getReceiver().getUsername() : null)
                .content(savedMessage.getContent())
                .timestamp(savedMessage.getTimestamp())
                .status(savedMessage.getStatus())
                .parentMessageId(savedMessage.getParentMessageId())
                .parentMessageText(savedMessage.getParentMessageText())
                .parentMessageSender(savedMessage.getParentMessageSender())
                .isForwarded(savedMessage.isForwarded())
                .isStarred(savedMessage.isStarred())
                .isPinned(savedMessage.isPinned())
                .reactions(savedMessage.getReactions())
                .isMedia(savedMessage.isMedia())
                .mediaUrl(savedMessage.getMediaUrl())
                .mediaType(savedMessage.getMediaType())
                .fileName(savedMessage.getFileName())
                .fileSize(savedMessage.getFileSize())
                .messageType(savedMessage.getMessageType())
                .callType(savedMessage.getCallType())
                .callStatus(savedMessage.getCallStatus())
                .callDuration(savedMessage.getCallDuration())
                .callStartedAt(savedMessage.getCallStartedAt())
                .callEndedAt(savedMessage.getCallEndedAt())
                .iv(savedMessage.getIv())
                .selfDestructSeconds(savedMessage.getSelfDestructSeconds())
                .expiresAt(savedMessage.getExpiresAt())
                .readAt(savedMessage.getReadAt())
                .isPriority(savedMessage.isPriority())
                .latitude(savedMessage.getLatitude())
                .longitude(savedMessage.getLongitude())
                .build();

        if (savedMessage.getGroup() != null) {
            response.setGroupId(savedMessage.getGroup().getId());
            response.setGroupName(savedMessage.getGroup().getName());

            // Broadcast to all group members
            for (com.whatsappclone.model.User member : savedMessage.getGroup().getMembers()) {
                messagingTemplate.convertAndSend(
                        "/topic/messages/" + member.getUsername(), 
                        response
                );
            }
        } else {
            // Broadcast to receiver's topic channel
            if (messageDto.getReceiverUsername() != null) {
                messagingTemplate.convertAndSend(
                        "/topic/messages/" + messageDto.getReceiverUsername(), 
                        response
                );
            }

            // Broadcast to sender's topic channel for UI confirmation
            messagingTemplate.convertAndSend(
                    "/topic/messages/" + messageDto.getSenderUsername(), 
                    response
            );
        }
    }

    // 2. WebSocket Handler: Tracks user online status when they connect
    @MessageMapping("/presence/connect")
    public void registerPresence(@Payload String username, SimpMessageHeaderAccessor headerAccessor) {
        if (username != null && !username.trim().isEmpty()) {
            headerAccessor.getSessionAttributes().put("username", username);
            presenceService.userOnline(username, headerAccessor.getSessionId());
        }
    }

    // WebSocket Handler: Handles WebRTC call signaling
    @MessageMapping("/call/signal")
    public void processCallSignal(@Payload com.whatsappclone.dto.CallSignalDto signal) {
        messagingTemplate.convertAndSend("/topic/calls/" + signal.getReceiverUsername(), signal);
    }

    // WebSocket Handler: Handles real-time typing / recording status
    @MessageMapping("/chat/typing")
    public void processTyping(@Payload TypingSignalDto typingSignal) {
        messagingTemplate.convertAndSend(
            "/topic/typing/" + typingSignal.getReceiverUsername(), 
            typingSignal
        );
    }

    // 3. REST API: Retrieves chat history between two users
    @GetMapping("/api/messages/{username1}/{username2}")
    public ResponseEntity<List<MessageResponseDto>> getChatHistory(
            @PathVariable String username1,
            @PathVariable String username2
    ) {
        List<Message> messages = messageService.getChatHistory(username1, username2);

        // Privacy Check for Read Receipts
        boolean showReadReceipts = true;
        com.whatsappclone.model.User u1 = userRepository.findByUsernameIgnoreCase(username1).orElse(null);
        com.whatsappclone.model.User u2 = userRepository.findByUsernameIgnoreCase(username2).orElse(null);
        if (u1 != null && u2 != null) {
            boolean r1 = privacySettingsRepository.findByUser(u1)
                    .map(com.whatsappclone.model.PrivacySettings::isReadReceipts).orElse(true);
            boolean r2 = privacySettingsRepository.findByUser(u2)
                    .map(com.whatsappclone.model.PrivacySettings::isReadReceipts).orElse(true);
            if (!r1 || !r2) {
                showReadReceipts = false;
            }
        }

        final boolean finalShowReadReceipts = showReadReceipts;
        List<MessageResponseDto> responseDtos = messages.stream()
                .map(msg -> MessageResponseDto.builder()
                        .id(msg.getId())
                        .senderUsername(msg.getSender().getUsername())
                        .receiverUsername(msg.getReceiver() != null ? msg.getReceiver().getUsername() : null)
                        .content(msg.getContent())
                        .timestamp(msg.getTimestamp())
                        .status(finalShowReadReceipts ? msg.getStatus() : "sent")
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
                        .callType(msg.getCallType())
                        .callStatus(msg.getCallStatus())
                        .callDuration(msg.getCallDuration())
                        .callStartedAt(msg.getCallStartedAt())
                        .callEndedAt(msg.getCallEndedAt())
                        .groupId(msg.getGroup() != null ? msg.getGroup().getId() : null)
                        .groupName(msg.getGroup() != null ? msg.getGroup().getName() : null)
                        .iv(msg.getIv())
                        .selfDestructSeconds(msg.getSelfDestructSeconds())
                        .expiresAt(msg.getExpiresAt())
                        .readAt(msg.getReadAt())
                        .isPriority(msg.isPriority())
                        .latitude(msg.getLatitude())
                        .longitude(msg.getLongitude())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseDtos);
    }

    @PostMapping("/api/messages/read/{senderUsername}")
    public ResponseEntity<?> markMessagesAsRead(@PathVariable String senderUsername, Principal principal) {
        String receiverUsername = principal.getName();
        messageService.markMessagesAsRead(senderUsername, receiverUsername);
        
        // Broadcast read receipt update to the sender so they update grey ticks to blue ticks immediately
        messagingTemplate.convertAndSend("/topic/messages/read/" + senderUsername, Map.of(
            "senderUsername", senderUsername,
            "receiverUsername", receiverUsername
        ));
        
        return ResponseEntity.ok(Map.of("message", "Messages marked as read"));
    }

    // 4. REST API: Retrieves list of currently online users
    @GetMapping("/api/users/online")
    public ResponseEntity<Set<String>> getOnlineUsers() {
        return ResponseEntity.ok(presenceService.getOnlineUsers());
    }

    // 5. REST API: Retrieves list of users who have chat history with current user
    @GetMapping("/api/messages/partners/{username}")
    public ResponseEntity<List<PartnerDto>> getChatPartners(@PathVariable String username) {
        List<com.whatsappclone.model.User> partners = messageService.getChatPartners(username);
        com.whatsappclone.model.User currentUser = userRepository.findByUsernameIgnoreCase(username).orElse(null);
        final Long currentUserId = currentUser != null ? currentUser.getId() : null;

        List<PartnerDto> dtos = partners.stream()
                .map(user -> {
                    String lastMessageText = null;
                    String lastMessageTime = null;
                    String lastMessageType = null;
                    String lastCallType = null;
                    String lastCallStatus = null;
                    Integer lastCallDuration = null;
                    String lastMessageSender = null;

                    if (currentUserId != null) {
                        Message lastMsg = messageRepository.findLastMessage(currentUserId, user.getId());
                        if (lastMsg != null) {
                            lastMessageText = lastMsg.getContent();
                            lastMessageTime = lastMsg.getTimestamp().toString();
                            lastMessageType = lastMsg.getMessageType();
                            lastCallType = lastMsg.getCallType();
                            lastCallStatus = lastMsg.getCallStatus();
                            lastCallDuration = lastMsg.getCallDuration();
                            lastMessageSender = lastMsg.getSender().getUsername();
                        }
                    }
                    return new PartnerDto(
                            user.getId(),
                            user.getUsername(),
                            user.getEmail(),
                            user.getPhoneNumber(),
                            user.getProfilePicUrl() != null ? user.getProfilePicUrl() : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
                            lastMessageText,
                            lastMessageTime,
                            lastMessageType,
                            lastCallType,
                            lastCallStatus,
                            lastCallDuration,
                            lastMessageSender
                    );
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @DeleteMapping("/api/messages/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long id, Principal principal) {
        Message msg = messageService.getMessageById(id);
        if (msg == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Message not found"));
        }
        
        String currentUsername = principal.getName();
        if (!msg.getSender().getUsername().equals(currentUsername) && !msg.getReceiver().getUsername().equals(currentUsername)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized"));
        }
        
        // check time limit for "Delete For Everyone" (say 15 minutes)
        if (msg.getSender().getUsername().equals(currentUsername)) {
            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            if (msg.getTimestamp().plusMinutes(15).isBefore(now)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Delete limit exceeded (max 15 mins)"));
            }
        }

        messageService.deleteMessageById(id);
        
        MessageResponseDto deleteNotification = MessageResponseDto.builder()
                .id(id)
                .senderUsername(msg.getSender().getUsername())
                .receiverUsername(msg.getReceiver().getUsername())
                .content("DELETED")
                .build();
                
        messagingTemplate.convertAndSend("/topic/messages/" + msg.getReceiver().getUsername(), deleteNotification);
        messagingTemplate.convertAndSend("/topic/messages/" + msg.getSender().getUsername(), deleteNotification);
        
        return ResponseEntity.ok(Map.of("message", "Message deleted successfully", "id", id));
    }

    // Toggle star status on message
    @PostMapping("/api/messages/star/{id}")
    public ResponseEntity<?> toggleStarMessage(@PathVariable Long id, Principal principal) {
        Message msg = messageService.getMessageById(id);
        if (msg == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Message not found"));
        }
        String currentUsername = principal.getName();
        if (!msg.getSender().getUsername().equals(currentUsername) && !msg.getReceiver().getUsername().equals(currentUsername)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized"));
        }
        msg.setStarred(!msg.isStarred());
        Message saved = messageService.saveMessageObj(msg);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "isStarred", saved.isStarred()));
    }

    // Toggle pin status on message
    @PostMapping("/api/messages/pin/{id}")
    public ResponseEntity<?> togglePinMessage(@PathVariable Long id, Principal principal) {
        Message msg = messageService.getMessageById(id);
        if (msg == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Message not found"));
        }
        String currentUsername = principal.getName();
        if (!msg.getSender().getUsername().equals(currentUsername) && !msg.getReceiver().getUsername().equals(currentUsername)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized"));
        }
        msg.setPinned(!msg.isPinned());
        Message saved = messageService.saveMessageObj(msg);
        return ResponseEntity.ok(Map.of("id", saved.getId(), "isPinned", saved.isPinned()));
    }

    // React to a message
    @PostMapping("/api/messages/react/{id}")
    public ResponseEntity<?> reactMessage(@PathVariable Long id, @RequestBody Map<String, String> body, Principal principal) {
        Message msg = messageService.getMessageById(id);
        if (msg == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Message not found"));
        }
        String currentUsername = principal.getName();
        if (!msg.getSender().getUsername().equals(currentUsername) && !msg.getReceiver().getUsername().equals(currentUsername)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Unauthorized"));
        }

        String emoji = body.get("reaction");
        String username = principal.getName();
        
        String currentReactions = msg.getReactions();
        Map<String, String> reactionMap = new HashMap<>();
        if (currentReactions != null && !currentReactions.isBlank()) {
            for (String r : currentReactions.split(",")) {
                String[] parts = r.split(":", 2);
                if (parts.length == 2) {
                    reactionMap.put(parts[0], parts[1]);
                }
            }
        }
        if (emoji == null || emoji.isBlank()) {
            reactionMap.remove(username);
        } else {
            reactionMap.put(username, emoji);
        }
        String newReactions = reactionMap.entrySet().stream()
                .map(e -> e.getKey() + ":" + e.getValue())
                .collect(Collectors.joining(","));
        msg.setReactions(newReactions.isBlank() ? null : newReactions);
        Message saved = messageService.saveMessageObj(msg);

        // Notify both users about the reaction update
        MessageResponseDto notification = MessageResponseDto.builder()
                .id(saved.getId())
                .senderUsername(saved.getSender().getUsername())
                .receiverUsername(saved.getReceiver().getUsername())
                .content(saved.getContent())
                .timestamp(saved.getTimestamp())
                .status(saved.getStatus())
                .parentMessageId(saved.getParentMessageId())
                .parentMessageText(saved.getParentMessageText())
                .parentMessageSender(saved.getParentMessageSender())
                .isForwarded(saved.isForwarded())
                .isStarred(saved.isStarred())
                .isPinned(saved.isPinned())
                .reactions(saved.getReactions())
                .isMedia(saved.isMedia())
                .mediaUrl(saved.getMediaUrl())
                .mediaType(saved.getMediaType())
                .fileName(saved.getFileName())
                .fileSize(saved.getFileSize())
                .build();
        messagingTemplate.convertAndSend("/topic/messages/" + saved.getReceiver().getUsername(), notification);
        messagingTemplate.convertAndSend("/topic/messages/" + saved.getSender().getUsername(), notification);

        return ResponseEntity.ok(Map.of("id", saved.getId(), "reactions", saved.getReactions() != null ? saved.getReactions() : ""));
    }

    @DeleteMapping("/api/messages/panic-wipe")
    public ResponseEntity<?> panicWipeUserMessages(Principal principal) {
        if (principal != null) {
            String username = principal.getName();
            com.whatsappclone.model.User user = userRepository.findByUsernameIgnoreCase(username).orElse(null);
            if (user != null) {
                List<Message> messagesToDelete = messageRepository.findMessagesInvolvingUser(user);
                for (Message msg : messagesToDelete) {
                    Map<String, Object> deletionEvent = Map.of(
                            "type", "MESSAGE_DELETED",
                            "reason", "PANIC_WIPE",
                            "messageId", msg.getId(),
                            "content", "DELETED"
                    );
                    if (msg.getSender() != null) {
                        messagingTemplate.convertAndSend("/topic/messages/" + msg.getSender().getUsername(), deletionEvent);
                    }
                    if (msg.getReceiver() != null) {
                        messagingTemplate.convertAndSend("/topic/messages/" + msg.getReceiver().getUsername(), deletionEvent);
                    }
                }
            }
            messageService.wipeUserMessages(username);
            return ResponseEntity.ok(Map.of("message", "Emergency panic wipe executed successfully. All chat session data purged."));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
    }

    public static record PartnerDto(
            Long id,
            String username,
            String email,
            String phoneNumber,
            String profilePicUrl,
            String lastMessage,
            String lastMessageTimestamp,
            String lastMessageType,
            String lastCallType,
            String lastCallStatus,
            Integer lastCallDuration,
            String lastMessageSender
    ) {}
}
