package com.whatsappclone.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "chat_groups")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String avatar;

    @ManyToOne
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    @ManyToMany(fetch = FetchType.EAGER)
    @Builder.Default
    @JoinTable(
        name = "group_members",
        joinColumns = @JoinColumn(name = "group_id"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> members = new HashSet<>();

    private LocalDateTime createdAt;

    @Transient
    private String lastMessage;
    @Transient
    private String lastMessageTimestamp;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
