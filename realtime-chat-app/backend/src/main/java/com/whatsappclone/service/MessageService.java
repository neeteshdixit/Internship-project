package com.whatsappclone.service;

import com.whatsappclone.model.Message;
import com.whatsappclone.model.User;
import com.whatsappclone.repo.MessageRepository;
import com.whatsappclone.repo.UserRepository;
import com.whatsappclone.dto.MessageDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final com.whatsappclone.repo.ChatGroupRepository chatGroupRepository;

    public Message saveMessage(String senderUsername, String receiverUsername, String content) {
        User sender = userRepository.findByUsernameIgnoreCase(senderUsername)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found: " + senderUsername));
        
        User receiver = userRepository.findByUsernameIgnoreCase(receiverUsername)
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found: " + receiverUsername));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .status("sent")
                .build();

        return messageRepository.save(message);
    }

    public Message saveMessage(MessageDto dto) {
        User sender = userRepository.findByUsernameIgnoreCase(dto.getSenderUsername())
                .orElseThrow(() -> new IllegalArgumentException("Sender not found: " + dto.getSenderUsername()));
        
        User receiver = null;
        com.whatsappclone.model.ChatGroup group = null;

        if (dto.getGroupId() != null) {
            group = chatGroupRepository.findById(dto.getGroupId())
                    .orElseThrow(() -> new IllegalArgumentException("Group not found with id: " + dto.getGroupId()));
        } else if (dto.getReceiverUsername() != null) {
            receiver = userRepository.findByUsernameIgnoreCase(dto.getReceiverUsername())
                    .orElseThrow(() -> new IllegalArgumentException("Receiver not found: " + dto.getReceiverUsername()));
        }

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .group(group)
                .content(dto.getContent())
                .status("sent")
                .parentMessageId(dto.getParentMessageId())
                .parentMessageText(dto.getParentMessageText())
                .parentMessageSender(dto.getParentMessageSender())
                .isForwarded(dto.isForwarded())
                .isStarred(dto.isStarred())
                .isPinned(dto.isPinned())
                .reactions(dto.getReactions())
                .isMedia(dto.isMedia())
                .mediaUrl(dto.getMediaUrl())
                .mediaType(dto.getMediaType())
                .fileName(dto.getFileName())
                .fileSize(dto.getFileSize())
                .build();

        return messageRepository.save(message);
    }

    public List<Message> getChatHistory(String username1, String username2) {
        User user1 = userRepository.findByUsernameIgnoreCase(username1)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username1));
        
        User user2 = userRepository.findByUsernameIgnoreCase(username2)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username2));

        return messageRepository.findChatHistory(user1, user2);
    }

    public List<User> getChatPartners(String username) {
        List<User> receivers = messageRepository.findReceiversForSender(username);
        List<User> senders = messageRepository.findSendersForReceiver(username);
        
        java.util.Map<Long, User> uniquePartners = new java.util.LinkedHashMap<>();
        for (User u : receivers) {
            if (u != null) {
                uniquePartners.put(u.getId(), u);
            }
        }
        for (User u : senders) {
            if (u != null) {
                uniquePartners.put(u.getId(), u);
            }
        }
        return new java.util.ArrayList<>(uniquePartners.values());
    }

    public Message getMessageById(Long id) {
        return messageRepository.findById(id).orElse(null);
    }

    public Message saveMessageObj(Message message) {
        return messageRepository.save(message);
    }

    public void deleteMessageById(Long id) {
        messageRepository.deleteById(id);
    }

    public void markMessagesAsRead(String senderUsername, String receiverUsername) {
        User sender = userRepository.findByUsernameIgnoreCase(senderUsername).orElse(null);
        User receiver = userRepository.findByUsernameIgnoreCase(receiverUsername).orElse(null);
        if (sender != null && receiver != null) {
            List<Message> unread = messageRepository.findUnreadMessages(sender, receiver);
            if (!unread.isEmpty()) {
                unread.forEach(msg -> msg.setStatus("read"));
                messageRepository.saveAll(unread);
            }
        }
    }

    public List<Message> getGroupChatHistory(Long groupId) {
        com.whatsappclone.model.ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with id: " + groupId));
        return messageRepository.findByGroupOrderByTimestampAsc(group);
    }
}
