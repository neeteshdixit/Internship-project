package com.whatsappclone.dto;

public class TypingSignalDto {
    private String senderUsername;
    private String receiverUsername;
    private String status; // "typing" | "recording" | "idle"

    public TypingSignalDto() {}

    public TypingSignalDto(String senderUsername, String receiverUsername, String status) {
        this.senderUsername = senderUsername;
        this.receiverUsername = receiverUsername;
        this.status = status;
    }

    public String getSenderUsername() { return senderUsername; }
    public void setSenderUsername(String senderUsername) { this.senderUsername = senderUsername; }
    public String getReceiverUsername() { return receiverUsername; }
    public void setReceiverUsername(String receiverUsername) { this.receiverUsername = receiverUsername; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
