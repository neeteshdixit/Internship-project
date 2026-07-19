package com.whatsappclone.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrivacySettingsDto {
    private String lastSeenVisibility;
    private String onlineVisibility;
    private String profilePhotoVisibility;
    private String aboutVisibility;
    private boolean readReceipts;
    private String groupPrivacy;
    private String callPrivacy;
}
