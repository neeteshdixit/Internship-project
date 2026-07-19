package com.whatsappclone.service.ai;

import com.whatsappclone.model.AiSettings;
import com.whatsappclone.repo.AiSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiProviderManager {

    private final DeviceAiProvider deviceAiProvider;
    private final OllamaAiProvider ollamaAiProvider;
    private final GeminiAiProvider geminiAiProvider;
    private final AiSettingsRepository aiSettingsRepository;

    public AiSettings getSettings() {
        return aiSettingsRepository.findById(1L).orElseGet(() -> {
            AiSettings defaultSettings = AiSettings.builder()
                    .id(1L)
                    .preferredProvider("AUTO")
                    .askPermissionEveryTime(true)
                    .alwaysAllowCloud(false)
                    .disableCloudAi(false)
                    .preferLocalProcessing(true)
                    .neverAutomaticallySendToCloud(true)
                    .showPrivacyNoticeBeforeCloud(true)
                    .build();
            return aiSettingsRepository.save(defaultSettings);
        });
    }

    public AiSettings saveSettings(AiSettings settings) {
        settings.setId(1L);
        return aiSettingsRepository.save(settings);
    }

    public AIProvider selectProvider() {
        AiSettings settings = getSettings();
        String pref = settings.getPreferredProvider();

        if ("DEVICE".equalsIgnoreCase(pref)) {
            return deviceAiProvider;
        } else if ("LOCAL".equalsIgnoreCase(pref)) {
            return ollamaAiProvider;
        } else if ("CLOUD".equalsIgnoreCase(pref)) {
            if (settings.isDisableCloudAi()) {
                return null;
            }
            return geminiAiProvider;
        }

        // AUTO preference mode flow:
        // Step 1: Device AI check
        if (deviceAiProvider.isAvailable()) {
            return deviceAiProvider;
        }

        // Step 2: Local AI check
        if (ollamaAiProvider.isAvailable()) {
            return ollamaAiProvider;
        }

        // Step 3: Cloud AI check (if not disabled)
        if (!settings.isDisableCloudAi() && geminiAiProvider.isAvailable()) {
            return geminiAiProvider;
        }

        return null;
    }
}
