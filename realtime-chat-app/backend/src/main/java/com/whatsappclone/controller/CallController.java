package com.whatsappclone.controller;

import com.whatsappclone.model.CallRecord;
import com.whatsappclone.model.Message;
import com.whatsappclone.model.User;
import com.whatsappclone.repo.CallRecordRepository;
import com.whatsappclone.repo.MessageRepository;
import com.whatsappclone.repo.UserRepository;
import com.whatsappclone.dto.MessageResponseDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class CallController {

    private final CallRecordRepository callRecordRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    // Get all call records for the logged-in user
    @GetMapping
    public ResponseEntity<?> getCallHistory(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User user = userRepository.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

        List<CallRecord> records = callRecordRepository.findByCallerOrReceiverOrderByTimestampDesc(user, user);
        List<Map<String, Object>> response = new ArrayList<>();

        for (CallRecord record : records) {
            response.add(buildCallHistoryEntry(record, user));
        }
        return ResponseEntity.ok(response);
    }

    // Save a call record + system message + broadcast to BOTH users
    @PostMapping
    public ResponseEntity<?> saveCallRecord(@RequestBody Map<String, Object> body, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        User caller = userRepository.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (caller == null) return ResponseEntity.status(404).body(Map.of("error", "Caller not found"));

        String receiverUsername = (String) body.get("receiverUsername");
        User receiver = userRepository.findByUsernameIgnoreCase(receiverUsername).orElse(null);
        if (receiver == null) return ResponseEntity.status(404).body(Map.of("error", "Receiver not found"));

        String callType  = ((String) body.getOrDefault("callType", "audio")).toLowerCase();
        String status    = ((String) body.getOrDefault("status", "missed")).toLowerCase();
        int duration     = ((Number) body.getOrDefault("durationSeconds", 0)).intValue();

        // 1. Save single shared CallRecord
        CallRecord record = new CallRecord(caller, receiver, callType, status, duration);
        CallRecord saved  = callRecordRepository.save(record);

        // 2. Save system call Message in chat
        Message callMessage = buildCallMessage(caller, receiver, callType, status, duration);
        Message savedMsg    = messageRepository.save(callMessage);

        // 3. Build broadcast DTO
        MessageResponseDto dto = buildMessageDto(savedMsg);

        // 4. Build call history entries for each user (direction differs)
        Map<String, Object> callerEntry   = buildCallHistoryEntry(saved, caller);
        Map<String, Object> receiverEntry = buildCallHistoryEntry(saved, receiver);

        // 5. Broadcast chat message to both
        messagingTemplate.convertAndSend("/topic/messages/" + caller.getUsername(), dto);
        messagingTemplate.convertAndSend("/topic/messages/" + receiver.getUsername(), dto);
        if (!caller.getUsername().equals(caller.getUsername().toLowerCase())) {
            messagingTemplate.convertAndSend("/topic/messages/" + caller.getUsername().toLowerCase(), dto);
        }
        if (!receiver.getUsername().equals(receiver.getUsername().toLowerCase())) {
            messagingTemplate.convertAndSend("/topic/messages/" + receiver.getUsername().toLowerCase(), dto);
        }

        // 6. Broadcast call history update to both
        messagingTemplate.convertAndSend("/topic/callhistory/" + caller.getUsername(), callerEntry);
        messagingTemplate.convertAndSend("/topic/callhistory/" + receiver.getUsername(), receiverEntry);
        if (!caller.getUsername().equals(caller.getUsername().toLowerCase())) {
            messagingTemplate.convertAndSend("/topic/callhistory/" + caller.getUsername().toLowerCase(), callerEntry);
        }
        if (!receiver.getUsername().equals(receiver.getUsername().toLowerCase())) {
            messagingTemplate.convertAndSend("/topic/callhistory/" + receiver.getUsername().toLowerCase(), receiverEntry);
        }

        return ResponseEntity.ok(Map.of("id", saved.getId(), "messageId", savedMsg.getId()));
    }

    // ---- helpers ----

    private Message buildCallMessage(User caller, User receiver, String callType, String status, int duration) {
        Message m = new Message();
        m.setSender(caller);
        m.setReceiver(receiver);
        m.setMessageType("CALL");
        m.setCallType(callType.toUpperCase());
        m.setCallStatus(normaliseStatus(status));
        m.setCallDuration(duration);
        m.setContent(callType.toUpperCase() + "_CALL");
        m.setTimestamp(LocalDateTime.now());
        m.setStatus("sent");
        if (duration > 0) {
            m.setCallEndedAt(LocalDateTime.now());
            m.setCallStartedAt(LocalDateTime.now().minusSeconds(duration));
        }
        return m;
    }

    private String normaliseStatus(String raw) {
        return switch (raw.toLowerCase()) {
            case "connected", "completed" -> "COMPLETED";
            case "missed"                 -> "MISSED";
            case "rejected"               -> "REJECTED";
            case "busy"                   -> "BUSY";
            case "cancelled"              -> "CANCELLED";
            case "offline"                -> "OFFLINE";
            case "no_answer"              -> "NO_ANSWER";
            case "failed"                 -> "FAILED";
            default                       -> raw.toUpperCase();
        };
    }

    private MessageResponseDto buildMessageDto(Message m) {
        return MessageResponseDto.builder()
                .id(m.getId())
                .senderUsername(m.getSender().getUsername())
                .receiverUsername(m.getReceiver().getUsername())
                .content(m.getContent())
                .timestamp(m.getTimestamp())
                .status(m.getStatus())
                .messageType(m.getMessageType())
                .callType(m.getCallType())
                .callStatus(m.getCallStatus())
                .callDuration(m.getCallDuration())
                .callStartedAt(m.getCallStartedAt())
                .callEndedAt(m.getCallEndedAt())
                .build();
    }

    private Map<String, Object> buildCallHistoryEntry(CallRecord record, User viewer) {
        Map<String, Object> map = new HashMap<>();
        boolean isCallerMe = record.getCaller().getUsername().equals(viewer.getUsername());
        User peer = isCallerMe ? record.getReceiver() : record.getCaller();

        map.put("id",             record.getId());
        map.put("callerUsername", record.getCaller().getUsername());
        map.put("receiverUsername", record.getReceiver().getUsername());
        map.put("peerUsername",   peer.getUsername());
        map.put("peerAvatar",     peer.getProfilePicUrl() != null ? peer.getProfilePicUrl()
                : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100");
        map.put("callType",       record.getCallType());
        map.put("status",         record.getStatus());
        map.put("durationSeconds", record.getDurationSeconds());
        map.put("direction",      isCallerMe ? "outgoing" : "incoming");
        map.put("timestamp",      record.getTimestamp().format(FORMATTER));
        map.put("startedAt",      record.getStartedAt() != null ? record.getStartedAt().format(FORMATTER) : null);
        map.put("endedAt",        record.getEndedAt()   != null ? record.getEndedAt().format(FORMATTER)   : null);
        return map;
    }
}
