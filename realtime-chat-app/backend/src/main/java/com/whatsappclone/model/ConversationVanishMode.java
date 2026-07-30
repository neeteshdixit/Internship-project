package com.whatsappclone.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "conversation_vanish_modes",
        uniqueConstraints = {
                @UniqueConstraint(columnNames = {"conversation_key"})
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationVanishMode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "conversation_key", nullable = false, unique = true)
    private String conversationKey;

    @Builder.Default
    private boolean enabled = false;

    private String enabledByUsername;

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void touch() {
        updatedAt = LocalDateTime.now();
    }
}
