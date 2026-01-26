package com.chat.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "opportunities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Opportunity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Opportunity title is required")
    @Column(nullable = false)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner; // The sales rep owning this deal

    @Column(columnDefinition = "TEXT")
    private String description;

    private BigDecimal value; // Monetary value of the deal

    // Stage: NEW, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST
    @Builder.Default
    private String stage = "NEW";

    private LocalDateTime expectedCloseDate;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // Probability of winning (0-100)
    private Integer probability;

    // Reason if lost
    @Column(columnDefinition = "TEXT")
    private String lostReason;

    // Amount actually won (may differ from value)
    private BigDecimal actualValue;
}
