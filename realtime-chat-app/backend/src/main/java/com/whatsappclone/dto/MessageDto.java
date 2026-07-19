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
}
