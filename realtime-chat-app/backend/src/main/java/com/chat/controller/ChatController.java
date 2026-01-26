package com.chat.controller;

import com.chat.model.Message;
import com.chat.service.MessageService;
import com.chat.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
@Slf4j
public class ChatController {

    private final MessageService messageService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    // REST API Endpoints

    @PostMapping("/private/send")
    public ResponseEntity<Message> sendPrivateMessage(
            @RequestParam Long receiverId,
            @RequestBody Map<String, String> payload,
            Principal principal) {
        try {
            Long senderId = userService.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getId();

            Message message = messageService.sendPrivateMessage(senderId, receiverId, payload.get("content"));
            
            // Notify receiver in real-time via WebSocket
            messagingTemplate.convertAndSendToUser(
                    String.valueOf(receiverId),
                    "/queue/messages",
                    message
            );
            
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/private/{userId}")
    public ResponseEntity<Page<Message>> getPrivateConversation(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Principal principal) {
        try {
            Long currentUserId = userService.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getId();

            Pageable pageable = PageRequest.of(page, size);
            Page<Message> messages = messageService.getPrivateConversationPaginated(currentUserId, userId, pageable);
            
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error fetching conversation: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Message>> getUnreadMessages(Principal principal) {
        try {
            Long userId = userService.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getId();

            List<Message> messages = messageService.getUnreadMessages(userId);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error fetching unread messages: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{messageId}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long messageId) {
        try {
            messageService.markMessageAsRead(messageId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error marking message as read: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{messageId}/edit")
    public ResponseEntity<Message> editMessage(
            @PathVariable Long messageId,
            @RequestBody Map<String, String> payload) {
        try {
            Message message = messageService.editMessage(messageId, payload.get("content"));
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            log.error("Error editing message: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{messageId}")
    public ResponseEntity<Void> deleteMessage(@PathVariable Long messageId) {
        try {
            messageService.deleteMessage(messageId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting message: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Message>> searchMessages(@RequestParam String keyword) {
        try {
            List<Message> messages = messageService.searchMessages(keyword);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error searching messages: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // WebSocket Endpoints

    @MessageMapping("/send")
    @SendTo("/chat/messages")
    public Message sendMessage(@Payload Message message) {
        message.setSentAt(LocalDateTime.now());
        log.info("Broadcasting message from {} to {}", message.getSender().getUsername(), message.getReceiver().getUsername());
        return messageService.sendPrivateMessage(
                message.getSender().getId(),
                message.getReceiver().getId(),
                message.getContent()
        );
    }

    @MessageMapping("/group/send")
    @SendTo("/chat/group/{groupId}")
    public Message sendGroupMessage(@Payload Message message) {
        message.setSentAt(LocalDateTime.now());
        log.info("Broadcasting group message from {}", message.getSender().getUsername());
        return message;
    }

    @MessageMapping("/typing")
    @SendTo("/chat/typing")
    public Map<String, Object> typingIndicator(@Payload Map<String, Object> payload) {
        payload.put("timestamp", LocalDateTime.now());
        return payload;
    }
}
