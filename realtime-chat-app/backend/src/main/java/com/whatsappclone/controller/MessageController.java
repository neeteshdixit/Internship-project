package com.whatsappclone.controller;

import com.whatsappclone.dto.MessageDto;
import com.whatsappclone.dto.MessageResponseDto;
import com.whatsappclone.model.Message;
import com.whatsappclone.service.MessageService;
import com.whatsappclone.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final PresenceService presenceService;

    // 1. WebSocket Handler: Receives and broadcasts real-time chat messages
    @MessageMapping("/chat")
    public void processMessage(@Payload MessageDto messageDto) {
        Message savedMessage = messageService.saveMessage(
                messageDto.getSenderUsername(),
                messageDto.getReceiverUsername(),
                messageDto.getContent()
        );

        MessageResponseDto response = MessageResponseDto.builder()
                .id(savedMessage.getId())
                .senderUsername(savedMessage.getSender().getUsername())
                .receiverUsername(savedMessage.getReceiver().getUsername())
                .content(savedMessage.getContent())
                .timestamp(savedMessage.getTimestamp())
                .status(savedMessage.getStatus())
                .build();

        // Broadcast to receiver's topic channel
        messagingTemplate.convertAndSend(
                "/topic/messages/" + messageDto.getReceiverUsername(), 
                response
        );

        // Broadcast to sender's topic channel for UI confirmation
        messagingTemplate.convertAndSend(
                "/topic/messages/" + messageDto.getSenderUsername(), 
                response
        );
    }

    // 2. WebSocket Handler: Tracks user online status when they connect
    @MessageMapping("/presence/connect")
    public void registerPresence(@Payload String username, SimpMessageHeaderAccessor headerAccessor) {
        if (username != null && !username.trim().isEmpty()) {
            headerAccessor.getSessionAttributes().put("username", username);
            presenceService.userOnline(username);
        }
    }

    // 3. REST API: Retrieves chat history between two users
    @GetMapping("/api/messages/{username1}/{username2}")
    public ResponseEntity<List<MessageResponseDto>> getChatHistory(
            @PathVariable String username1,
            @PathVariable String username2
    ) {
        List<Message> messages = messageService.getChatHistory(username1, username2);
        
        List<MessageResponseDto> responseDtos = messages.stream()
                .map(msg -> MessageResponseDto.builder()
                        .id(msg.getId())
                        .senderUsername(msg.getSender().getUsername())
                        .receiverUsername(msg.getReceiver().getUsername())
                        .content(msg.getContent())
                        .timestamp(msg.getTimestamp())
                        .status(msg.getStatus())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(responseDtos);
    }

    // 4. REST API: Retrieves list of currently online users
    @GetMapping("/api/users/online")
    public ResponseEntity<Set<String>> getOnlineUsers() {
        return ResponseEntity.ok(presenceService.getOnlineUsers());
    }
}
