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

    @Column(nullable = false, length = 4000)
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

    private String reactions;

    @Builder.Default
    private boolean isMedia = false;
    private String mediaUrl;
    private String mediaType;
    private String fileName;
    private Long fileSize;

    private String messageType; // "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "VOICE" | "CALL" | "LOCATION"
    private String callType;
    private String callStatus;
    private Integer callDuration;
    private LocalDateTime callStartedAt;
    private LocalDateTime callEndedAt;

    // Field Communication & Encryption fields
    private String iv;
    private Integer selfDestructSeconds;
    private LocalDateTime expiresAt;
    private LocalDateTime readAt;

    @Builder.Default
    @jakarta.persistence.Column(columnDefinition = "boolean default false")
    private boolean isPriority = false;

    private Double latitude;
    private Double longitude;

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

    // Explicit Getters and Setters for Guaranteed Compilation
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getSender() { return sender; }
    public void setSender(User sender) { this.sender = sender; }
    public User getReceiver() { return receiver; }
    public void setReceiver(User receiver) { this.receiver = receiver; }
    public ChatGroup getGroup() { return group; }
    public void setGroup(ChatGroup group) { this.group = group; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getParentMessageId() { return parentMessageId; }
    public void setParentMessageId(Long parentMessageId) { this.parentMessageId = parentMessageId; }
    public String getParentMessageText() { return parentMessageText; }
    public void setParentMessageText(String parentMessageText) { this.parentMessageText = parentMessageText; }
    public String getParentMessageSender() { return parentMessageSender; }
    public void setParentMessageSender(String parentMessageSender) { this.parentMessageSender = parentMessageSender; }
    public boolean isForwarded() { return isForwarded; }
    public void setForwarded(boolean forwarded) { isForwarded = forwarded; }
    public boolean isStarred() { return isStarred; }
    public void setStarred(boolean starred) { isStarred = starred; }
    public boolean isPinned() { return isPinned; }
    public void setPinned(boolean pinned) { isPinned = pinned; }
    public String getReactions() { return reactions; }
    public void setReactions(String reactions) { this.reactions = reactions; }
    public boolean isMedia() { return isMedia; }
    public void setMedia(boolean media) { isMedia = media; }
    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    public String getCallType() { return callType; }
    public void setCallType(String callType) { this.callType = callType; }
    public String getCallStatus() { return callStatus; }
    public void setCallStatus(String callStatus) { this.callStatus = callStatus; }
    public Integer getCallDuration() { return callDuration; }
    public void setCallDuration(Integer callDuration) { this.callDuration = callDuration; }
    public LocalDateTime getCallStartedAt() { return callStartedAt; }
    public void setCallStartedAt(LocalDateTime callStartedAt) { this.callStartedAt = callStartedAt; }
    public LocalDateTime getCallEndedAt() { return callEndedAt; }
    public void setCallEndedAt(LocalDateTime callEndedAt) { this.callEndedAt = callEndedAt; }
    public String getIv() { return iv; }
    public void setIv(String iv) { this.iv = iv; }
    public Integer getSelfDestructSeconds() { return selfDestructSeconds; }
    public void setSelfDestructSeconds(Integer selfDestructSeconds) { this.selfDestructSeconds = selfDestructSeconds; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public LocalDateTime getReadAt() { return readAt; }
    public void setReadAt(LocalDateTime readAt) { this.readAt = readAt; }
    public boolean isPriority() { return isPriority; }
    public void setPriority(boolean priority) { isPriority = priority; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
