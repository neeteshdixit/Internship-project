package com.whatsappclone.controller;

import com.whatsappclone.model.Message;
import com.whatsappclone.model.User;
import com.whatsappclone.service.MessageService;
import com.whatsappclone.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final MessageService messageService;
    private final UserRepository userRepository;

    @GetMapping("/{peerUsername}")
    public ResponseEntity<?> getConversationAnalytics(@PathVariable String peerUsername, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        String myUsername = principal.getName();
        User me = userRepository.findByUsernameIgnoreCase(myUsername).orElse(null);
        User peer = userRepository.findByUsernameIgnoreCase(peerUsername).orElse(null);
        if (me == null || peer == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        List<Message> history = messageService.getChatHistory(myUsername, peerUsername);
        
        long totalMessages = history.size();
        long imagesShared = 0;
        long documentsShared = 0;
        long voiceNotes = 0;
        String chatStartedOn = "N/A";
        double averageResponseTimeMinutes = 0.0;
        long longestConversationMinutes = 0;

        if (totalMessages > 0) {
            chatStartedOn = history.get(0).getTimestamp().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            
            long responseCount = 0;
            double totalResponseTimeSeconds = 0;
            
            long currentSessionDurationSeconds = 0;
            long maxSessionDurationSeconds = 0;
            Message sessionStartMessage = history.get(0);

            for (int i = 0; i < history.size(); i++) {
                Message msg = history.get(i);
                
                // Count media types
                if (msg.isMedia()) {
                    String mt = msg.getMediaType();
                    if ("image".equalsIgnoreCase(mt)) {
                        imagesShared++;
                    } else if ("document".equalsIgnoreCase(mt)) {
                        documentsShared++;
                    } else if ("audio".equalsIgnoreCase(mt)) {
                        voiceNotes++;
                    }
                }

                // Response time calculation (sender switches)
                if (i > 0) {
                    Message prev = history.get(i - 1);
                    if (!msg.getSender().getUsername().equals(prev.getSender().getUsername())) {
                        long diffSeconds = Duration.between(prev.getTimestamp(), msg.getTimestamp()).toSeconds();
                        // Only count response times under 4 hours to avoid overnight gaps skewing average
                        if (diffSeconds > 0 && diffSeconds < 4 * 3600) {
                            totalResponseTimeSeconds += diffSeconds;
                            responseCount++;
                        }
                    }
                    
                    // Session calculation (continuous messaging with gaps < 30 minutes)
                    long gapSeconds = Duration.between(prev.getTimestamp(), msg.getTimestamp()).toSeconds();
                    if (gapSeconds < 1800) {
                        currentSessionDurationSeconds = Duration.between(sessionStartMessage.getTimestamp(), msg.getTimestamp()).toSeconds();
                    } else {
                        // End of session, check if it's the longest
                        if (currentSessionDurationSeconds > maxSessionDurationSeconds) {
                            maxSessionDurationSeconds = currentSessionDurationSeconds;
                        }
                        // Reset session
                        sessionStartMessage = msg;
                        currentSessionDurationSeconds = 0;
                    }
                }
            }
            
            // final session check
            if (currentSessionDurationSeconds > maxSessionDurationSeconds) {
                maxSessionDurationSeconds = currentSessionDurationSeconds;
            }

            if (responseCount > 0) {
                averageResponseTimeMinutes = (totalResponseTimeSeconds / responseCount) / 60.0;
            }
            longestConversationMinutes = maxSessionDurationSeconds / 60;
        }

        // Format response time to 1 decimal place
        averageResponseTimeMinutes = Math.round(averageResponseTimeMinutes * 10.0) / 10.0;

        return ResponseEntity.ok(Map.of(
                "totalMessages", totalMessages,
                "imagesShared", imagesShared,
                "documentsShared", documentsShared,
                "voiceNotes", voiceNotes,
                "averageResponseTimeMinutes", averageResponseTimeMinutes,
                "longestConversationMinutes", longestConversationMinutes,
                "chatStartedOn", chatStartedOn
        ));
    }
}
