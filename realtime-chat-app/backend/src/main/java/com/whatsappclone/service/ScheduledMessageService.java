package com.whatsappclone.service;

import com.whatsappclone.dto.MessageResponseDto;
import com.whatsappclone.model.Message;
import com.whatsappclone.model.ScheduledMessage;
import com.whatsappclone.repo.MessageRepository;
import com.whatsappclone.repo.ScheduledMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScheduledMessageService {

    private final ScheduledMessageRepository scheduledMessageRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // Check for pending scheduled messages every 15 seconds
    @Scheduled(fixedRate = 15000)
    public void processScheduledMessages() {
        LocalDateTime now = LocalDateTime.now();
        List<ScheduledMessage> pending = scheduledMessageRepository.findBySentFalseAndScheduledTimeBefore(now);
        
        if (pending.isEmpty()) {
            return;
        }

        log.info("Found {} pending scheduled messages to deliver.", pending.size());

        for (ScheduledMessage sm : pending) {
            try {
                // 1. Create and save normal Message
                Message normalMsg = Message.builder()
                        .sender(sm.getSender())
                        .receiver(sm.getReceiver())
                        .content(sm.getContent())
                        .status("sent")
                        .timestamp(LocalDateTime.now())
                        .build();
                Message saved = messageRepository.save(normalMsg);

                // 2. Broadcast via WebSocket
                MessageResponseDto response = MessageResponseDto.builder()
                        .id(saved.getId())
                        .senderUsername(saved.getSender().getUsername())
                        .receiverUsername(saved.getReceiver().getUsername())
                        .content(saved.getContent())
                        .timestamp(saved.getTimestamp())
                        .status(saved.getStatus())
                        .build();

                messagingTemplate.convertAndSend("/topic/messages/" + response.getReceiverUsername(), response);
                messagingTemplate.convertAndSend("/topic/messages/" + response.getSenderUsername(), response);

                // 3. Mark as sent
                sm.setSent(true);
                scheduledMessageRepository.save(sm);
                log.info("Delivered scheduled message ID {} successfully.", sm.getId());
            } catch (Exception e) {
                log.error("Failed to deliver scheduled message ID {}", sm.getId(), e);
            }
        }
    }
}
