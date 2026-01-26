package com.chat.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Content is required")
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id")
    private User receiver; // For private messages; null for group messages

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id")
    private Group group; // For group messages; null for private messages

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime sentAt;

    // Message type: TEXT, IMAGE, FILE, VOICE, VIDEO
    @Builder.Default
    private String messageType = "TEXT";

    // For edited messages
    private LocalDateTime editedAt;

    // For message status: SENT, DELIVERED, READ
    @Builder.Default
    private String status = "SENT";

    // Optional: file/media path
    private String attachmentUrl;
}
