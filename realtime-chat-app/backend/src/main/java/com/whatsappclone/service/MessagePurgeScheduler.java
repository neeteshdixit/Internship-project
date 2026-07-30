package com.whatsappclone.service;

import com.whatsappclone.model.Message;
import com.whatsappclone.repo.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class MessagePurgeScheduler {

    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedRate = 3000) // Runs every 3 seconds
    @Transactional
    public void purgeExpiredMessages() {
        LocalDateTime now = LocalDateTime.now();
        List<Message> expiredMessages = messageRepository.findByExpiresAtLessThanEqual(now);

        if (!expiredMessages.isEmpty()) {
            for (Message msg : expiredMessages) {
                Map<String, Object> deletionEvent = Map.of(
                        "type", "MESSAGE_DELETED",
                        "reason", "EXPIRED",
                        "messageId", msg.getId(),
                        "content", "DELETED"
                );

                Set<String> recipients = new LinkedHashSet<>();
                if (msg.getGroup() != null && msg.getGroup().getMembers() != null) {
                    msg.getGroup().getMembers().forEach(member -> recipients.add(member.getUsername()));
                } else {
                    if (msg.getReceiver() != null) recipients.add(msg.getReceiver().getUsername());
                    if (msg.getSender() != null) recipients.add(msg.getSender().getUsername());
                }

                for (String username : recipients) {
                    messagingTemplate.convertAndSend("/topic/messages/" + username, deletionEvent);
                }
            }

            // Permanently shred expired messages from PostgreSQL database
            messageRepository.deleteAll(expiredMessages);
        }
    }
}
