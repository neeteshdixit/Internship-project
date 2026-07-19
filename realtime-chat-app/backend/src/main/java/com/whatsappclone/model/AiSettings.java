package com.whatsappclone.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ai_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiSettings {
    @Id
    private Long id = 1L; // Singleton settings record

    private String preferredProvider; // AUTO, DEVICE, LOCAL, CLOUD
    private boolean askPermissionEveryTime;
    private boolean alwaysAllowCloud;
    private boolean disableCloudAi;
    private boolean preferLocalProcessing;
    private boolean neverAutomaticallySendToCloud;
    private boolean showPrivacyNoticeBeforeCloud;
}
