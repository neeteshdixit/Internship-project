package com.chat.service;

import com.chat.model.Message;
import com.chat.model.User;
import com.chat.repo.MessageRepository;
import com.chat.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public Message sendPrivateMessage(Long senderId, Long receiverId, String content) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .messageType("TEXT")
                .status("UNREAD")
                .sentAt(LocalDateTime.now())
                .build();

        log.info("Sending message from {} to {}", sender.getUsername(), receiver.getUsername());
        return messageRepository.save(message);
    }

    public Message sendGroupMessage(Long senderId, Long groupId, String content) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        Message message = Message.builder()
                .sender(sender)
                .content(content)
                .messageType("TEXT")
                .status("UNREAD")
                .sentAt(LocalDateTime.now())
                .build();

        log.info("Sending message from {} to group {}", sender.getUsername(), groupId);
        return messageRepository.save(message);
    }

    public List<Message> getPrivateConversation(Long userId1, Long userId2) {
        return messageRepository.findPrivateConversation(userId1, userId2);
    }

    public Page<Message> getPrivateConversationPaginated(Long userId1, Long userId2, Pageable pageable) {
        return messageRepository.findPrivateConversation(userId1, userId2, pageable);
    }

    public List<Message> getGroupMessages(Long groupId) {
        return messageRepository.findByGroupId(groupId);
    }

    public Page<Message> getGroupMessagesPaginated(Long groupId, Pageable pageable) {
        return messageRepository.findByGroupId(groupId, pageable);
    }

    public List<Message> getUnreadMessages(Long userId) {
        return messageRepository.findUnreadMessages(userId);
    }

    public void markMessageAsRead(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (message.getReceiver() == null || !message.getReceiver().getId().equals(userId)) {
            throw new RuntimeException("Not allowed to mark this message as read");
        }
        message.setStatus("READ");
        messageRepository.save(message);
    }

    public Message editMessage(Long messageId, Long userId, String newContent) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("Not allowed to edit this message");
        }
        message.setContent(newContent);
        message.setEditedAt(LocalDateTime.now());
        log.info("Message edited: {}", messageId);
        return messageRepository.save(message);
    }

    public void deleteMessage(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("Not allowed to delete this message");
        }
        messageRepository.deleteById(messageId);
        log.info("Message deleted: {}", messageId);
    }

    public List<Message> searchMessages(Long userId, String keyword) {
        return messageRepository.searchMessagesForUser(userId, keyword);
    }

    public List<Message> getUserSentMessages(Long userId) {
        return messageRepository.findBySenderIdOrderBySentAtDesc(userId);
    }
}
