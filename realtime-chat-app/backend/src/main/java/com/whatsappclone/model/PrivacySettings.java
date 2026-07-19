package com.whatsappclone.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "privacy_settings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrivacySettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    private String lastSeenVisibility = "EVERYONE"; // EVERYONE, CONTACTS, NOBODY

    @Builder.Default
    private String onlineVisibility = "EVERYONE"; // EVERYONE, SAME_AS_LAST_SEEN

    @Builder.Default
    private String profilePhotoVisibility = "EVERYONE"; // EVERYONE, CONTACTS, NOBODY

    @Builder.Default
    private String aboutVisibility = "EVERYONE"; // EVERYONE, CONTACTS, NOBODY

    @Builder.Default
    private boolean readReceipts = true;

    @Builder.Default
    private String groupPrivacy = "EVERYONE"; // EVERYONE, CONTACTS, CONTACTS_EXCEPT

    @Builder.Default
    private String callPrivacy = "EVERYONE"; // EVERYONE, CONTACTS
}
