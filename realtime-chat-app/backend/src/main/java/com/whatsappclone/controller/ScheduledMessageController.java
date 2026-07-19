package com.whatsappclone.controller;

import com.whatsappclone.model.ScheduledMessage;
import com.whatsappclone.model.User;
import com.whatsappclone.repo.ScheduledMessageRepository;
import com.whatsappclone.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages/schedule")
@RequiredArgsConstructor
public class ScheduledMessageController {

    private final ScheduledMessageRepository scheduledMessageRepository;
    private final UserRepository userRepository;

    // Get all unsent scheduled messages composed by current user
    @GetMapping
    public ResponseEntity<?> getScheduledMessages(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User user = userRepository.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        List<ScheduledMessage> messages = scheduledMessageRepository.findBySenderOrderByScheduledTimeAsc(user);
        List<Map<String, Object>> response = new ArrayList<>();
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        for (ScheduledMessage msg : messages) {
            if (msg.isSent()) continue; // only return pending ones
            
            Map<String, Object> map = new HashMap<>();
            map.put("id", msg.getId());
            map.put("receiverUsername", msg.getReceiver().getUsername());
            map.put("content", msg.getContent());
            map.put("scheduledTime", msg.getScheduledTime().format(formatter));
            response.add(map);
        }

        return ResponseEntity.ok(response);
    }

    // Schedule a message
    @PostMapping
    public ResponseEntity<?> scheduleMessage(@RequestBody Map<String, Object> body, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User sender = userRepository.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (sender == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Sender not found"));
        }

        String receiverUsername = (String) body.get("receiverUsername");
        User receiver = userRepository.findByUsernameIgnoreCase(receiverUsername).orElse(null);
        if (receiver == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Receiver not found"));
        }

        String content = (String) body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Content cannot be empty"));
        }

        String timeStr = (String) body.get("scheduledTime");
        LocalDateTime scheduledTime;
        try {
            // Support standard ISO-8601 formatting, e.g. 2026-07-04T12:00:00
            scheduledTime = LocalDateTime.parse(timeStr);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid scheduled time format. Use ISO-8601 (e.g. YYYY-MM-DDTHH:MM:SS)"));
        }

        if (scheduledTime.isBefore(LocalDateTime.now())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Scheduled time must be in the future"));
        }

        ScheduledMessage sm = new ScheduledMessage(sender, receiver, content, scheduledTime);
        ScheduledMessage saved = scheduledMessageRepository.save(sm);

        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Message scheduled successfully"));
    }

    // Cancel/delete scheduled message
    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelScheduledMessage(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        ScheduledMessage sm = scheduledMessageRepository.findById(id).orElse(null);
        if (sm == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Scheduled message not found"));
        }

        if (!sm.getSender().getUsername().equalsIgnoreCase(principal.getName())) {
            return ResponseEntity.status(403).body(Map.of("error", "Unauthorized to cancel this message"));
        }

        if (sm.isSent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Cannot cancel a message that is already sent"));
        }

        scheduledMessageRepository.delete(sm);
        return ResponseEntity.ok(Map.of("message", "Scheduled message cancelled successfully"));
    }
}
