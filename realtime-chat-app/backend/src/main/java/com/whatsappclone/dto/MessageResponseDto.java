package com.whatsappclone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponseDto {
    private Long id;
    private String senderUsername;
    private String receiverUsername;
    private String content;
    private LocalDateTime timestamp;
    private String status;

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

    private String messageType;
    private String callType;
    private String callStatus;
    private Integer callDuration;
    private LocalDateTime callStartedAt;
    private LocalDateTime callEndedAt;
    private Long groupId;
    private String groupName;
}
