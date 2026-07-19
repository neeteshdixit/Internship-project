package com.whatsappclone.service.ai;

import com.whatsappclone.service.AiGateway;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class OllamaAiProvider implements AIProvider {
    private final AiGateway aiGateway;

    @Override
    public String getName() {
        return "Ollama";
    }

    @Override
    public boolean isLocal() {
        return true;
    }

    @Override
    public boolean isAvailable() {
        try {
            // Quick ping to check if Ollama is running
            aiGateway.generate("ping");
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String generate(String promptText) {
        return aiGateway.generate(promptText);
    }
}
