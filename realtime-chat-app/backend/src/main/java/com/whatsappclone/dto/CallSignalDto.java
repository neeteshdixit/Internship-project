package com.whatsappclone.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallSignalDto {
    private String senderUsername;
    private String receiverUsername;
    private String type; // "offer", "answer", "candidate", "reject", "end", "ringing"
    private String sdp;
    private Object candidate; // For ICE candidates
    private String callType; // "audio" or "video"
}
