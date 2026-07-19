package com.whatsappclone.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contacts", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"owner_id", "contact_user_id"})
})
public class Contact {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_user_id", nullable = false)
    private User contactUser;

    private String customName;

    private boolean isFavorite = false;
    private boolean isBlocked = false;
    private boolean isPinned = false;
    private boolean isArchived = false;
    private boolean isMuted = false;
    private String label; // "family" | "work" | "college" | "important" | null

    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }
    public User getContactUser() { return contactUser; }
    public void setContactUser(User contactUser) { this.contactUser = contactUser; }
    public String getCustomName() { return customName; }
    public void setCustomName(String customName) { this.customName = customName; }
    public boolean isFavorite() { return isFavorite; }
    public void setFavorite(boolean favorite) { isFavorite = favorite; }
    public boolean isBlocked() { return isBlocked; }
    public void setBlocked(boolean blocked) { isBlocked = blocked; }
    public boolean isPinned() { return isPinned; }
    public void setPinned(boolean pinned) { isPinned = pinned; }
    public boolean isArchived() { return isArchived; }
    public void setArchived(boolean archived) { isArchived = archived; }
    public boolean isMuted() { return isMuted; }
    public void setMuted(boolean muted) { isMuted = muted; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
