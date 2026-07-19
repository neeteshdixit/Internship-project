package com.whatsappclone.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "statuses")
public class Status {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(columnDefinition = "TEXT")
    private String mediaUrl; // optional media URL

    private String caption;
    private String type; // "text" | "image" | "video"
    private String textBackground; // Hex color for text stories

    @Column(nullable = false)
    private LocalDateTime expiresAt;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Status() {}

    public Status(User user, String mediaUrl, String caption, String type, String textBackground, LocalDateTime expiresAt) {
        this.user = user;
        this.mediaUrl = mediaUrl;
        this.caption = caption;
        this.type = type;
        this.textBackground = textBackground;
        this.expiresAt = expiresAt;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
    public String getCaption() { return caption; }
    public void setCaption(String caption) { this.caption = caption; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTextBackground() { return textBackground; }
    public void setTextBackground(String textBackground) { this.textBackground = textBackground; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
