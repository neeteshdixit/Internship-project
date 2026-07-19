package com.whatsappclone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiReportResponse {
    private String responseText;
    private String provider;
    private String processingMode; // Local or Cloud
    private boolean sentOutsideDevice;
    private boolean temporaryBufferReleased;
    private double processingTimeSeconds;
    private String status; // Completed, Failed
}
