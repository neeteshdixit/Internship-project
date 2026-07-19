package com.whatsappclone.service.ai;

import org.springframework.stereotype.Component;

@Component
public class DeviceAiProvider implements AIProvider {
    @Override
    public String getName() {
        return "Device AI";
    }

    @Override
    public boolean isLocal() {
        return true;
    }

    @Override
    public boolean isAvailable() {
        // Placeholder for future local Device AI detection
        return false;
    }

    @Override
    public String generate(String promptText) {
        throw new UnsupportedOperationException("Device AI is not implemented on this device yet.");
    }
}
