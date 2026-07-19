package com.whatsappclone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = true)
    private User receiver;

    @ManyToOne
    @JoinColumn(name = "group_id", nullable = true)
    private ChatGroup group;

    @Column(nullable = false, length = 2000)
    private String content;

    private LocalDateTime timestamp;

    private String status; // "sent", "delivered", "read"

    private Long parentMessageId;
    private String parentMessageText;
    private String parentMessageSender;

    @Builder.Default
    private boolean isForwarded = false;

    @Builder.Default
    private boolean isStarred = false;

    @Builder.Default
    private boolean isPinned = false;

    private String reactions; // format "username:emoji,username2:emoji"

    @Builder.Default
    private boolean isMedia = false;
    private String mediaUrl;
    private String mediaType;
    private String fileName;
    private Long fileSize;

    private String messageType; // "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "VOICE" | "CALL"
    private String callType; // "AUDIO" | "VIDEO"
    private String callStatus; // "OUTGOING" | "INCOMING" | "MISSED" | "REJECTED" | "CANCELLED" | "BUSY" | "NO_ANSWER" | "COMPLETED" | "FAILED" | "NETWORK_ERROR" | "OFFLINE"
    private Integer callDuration; // in seconds
    private LocalDateTime callStartedAt;
    private LocalDateTime callEndedAt;

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
        if (status == null) {
            status = "sent";
        }
        if (messageType == null) {
            messageType = "TEXT";
        }
    }
}
