package com.whatsappclone.dto;

public class ContactDTO {
    private Long id; // Contact record ID
    private Long contactUserId; // User ID of the contact
    private String username;
    private String name;
    private String avatar;
    private String customName;
    private String phoneNumber;
    private boolean isOnline;
    private boolean isFavorite;
    private boolean isBlocked;
    private boolean isPinned;
    private boolean isArchived;
    private boolean isMuted;
    private String label;
    private String lastMessageTimestamp;

    // constructors
    public ContactDTO() {}

    public ContactDTO(Long id, Long contactUserId, String username, String name, String avatar, String customName, String phoneNumber, boolean isOnline,
                      boolean isFavorite, boolean isBlocked, boolean isPinned, boolean isArchived, boolean isMuted, String label, String lastMessageTimestamp) {
        this.id = id;
        this.contactUserId = contactUserId;
        this.username = username;
        this.name = name;
        this.avatar = avatar;
        this.customName = customName;
        this.phoneNumber = phoneNumber;
        this.isOnline = isOnline;
        this.isFavorite = isFavorite;
        this.isBlocked = isBlocked;
        this.isPinned = isPinned;
        this.isArchived = isArchived;
        this.isMuted = isMuted;
        this.label = label;
        this.lastMessageTimestamp = lastMessageTimestamp;
    }

    // getters & setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getContactUserId() { return contactUserId; }
    public void setContactUserId(Long contactUserId) { this.contactUserId = contactUserId; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getCustomName() { return customName; }
    public void setCustomName(String customName) { this.customName = customName; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public boolean isOnline() { return isOnline; }
    public void setOnline(boolean online) { isOnline = online; }
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
    public String getLastMessageTimestamp() { return lastMessageTimestamp; }
    public void setLastMessageTimestamp(String lastMessageTimestamp) { this.lastMessageTimestamp = lastMessageTimestamp; }
}
