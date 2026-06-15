package com.whatsappclone.service;

import com.whatsappclone.model.Message;
import com.whatsappclone.model.User;
import com.whatsappclone.repo.MessageRepository;
import com.whatsappclone.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public Message saveMessage(String senderUsername, String receiverUsername, String content) {
        User sender = userRepository.findByUsername(senderUsername)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found: " + senderUsername));
        
        User receiver = userRepository.findByUsername(receiverUsername)
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found: " + receiverUsername));

        Message message = Message.builder()
                .sender(sender)
                .receiver(receiver)
                .content(content)
                .status("sent")
                .build();

        return messageRepository.save(message);
    }

    public List<Message> getChatHistory(String username1, String username2) {
        User user1 = userRepository.findByUsername(username1)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username1));
        
        User user2 = userRepository.findByUsername(username2)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username2));

        return messageRepository.findChatHistory(user1, user2);
    }
}
