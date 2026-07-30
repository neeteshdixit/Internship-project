package com.whatsappclone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private String senderUsername;
    private String receiverUsername;
    private String content;

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
    private Long groupId;

    // Field Communication & Encrypted Ephemeral Message Fields
    private String iv;
    private Integer selfDestructSeconds;
    private String messageType;
    @Builder.Default
    private boolean isPriority = false;
    private Double latitude;
    private Double longitude;

    // Explicit Getters and Setters
    public String getSenderUsername() { return senderUsername; }
    public void setSenderUsername(String senderUsername) { this.senderUsername = senderUsername; }
    public String getReceiverUsername() { return receiverUsername; }
    public void setReceiverUsername(String receiverUsername) { this.receiverUsername = receiverUsername; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
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
    public Long getGroupId() { return groupId; }
    public void setGroupId(Long groupId) { this.groupId = groupId; }
    public String getIv() { return iv; }
    public void setIv(String iv) { this.iv = iv; }
    public Integer getSelfDestructSeconds() { return selfDestructSeconds; }
    public void setSelfDestructSeconds(Integer selfDestructSeconds) { this.selfDestructSeconds = selfDestructSeconds; }
    public String getMessageType() { return messageType; }
    public void setMessageType(String messageType) { this.messageType = messageType; }
    public boolean isPriority() { return isPriority; }
    public void setPriority(boolean priority) { isPriority = priority; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
