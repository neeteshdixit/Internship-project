package com.whatsappclone.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "call_records")
public class CallRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "caller_id", nullable = false)
    private User caller;

    @ManyToOne
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @Column(nullable = false)
    private String callType; // "audio" | "video"

    @Column(nullable = false)
    private String status; // "missed" | "connected" | "rejected" | "busy" | "cancelled" | "no_answer" | "offline" | "failed"

    private int durationSeconds;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    public CallRecord() {}

    public CallRecord(User caller, User receiver, String callType, String status, int durationSeconds) {
        this.caller = caller;
        this.receiver = receiver;
        this.callType = callType;
        this.status = status;
        this.durationSeconds = durationSeconds;
        this.timestamp = LocalDateTime.now();
        this.endedAt = LocalDateTime.now();
        if (durationSeconds > 0) {
            this.startedAt = this.endedAt.minusSeconds(durationSeconds);
        } else {
            this.startedAt = this.endedAt;
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getCaller() { return caller; }
    public void setCaller(User caller) { this.caller = caller; }
    public User getReceiver() { return receiver; }
    public void setReceiver(User receiver) { this.receiver = receiver; }
    public String getCallType() { return callType; }
    public void setCallType(String callType) { this.callType = callType; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
}
