package com.whatsappclone.service;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiGateway {

    private final ChatModel chatModel;

    @Value("${spring.ai.ollama.chat.options.model:phi3}")
    private String defaultModel;

    @Value("${ai.temperature:0.7}")
    private Double temperature;

    @Value("${ai.max-tokens:1024}")
    private Integer maxTokens;

    public String generate(String promptText) {
        OllamaOptions options = OllamaOptions.create()
                .withModel(defaultModel)
                .withTemperature(temperature.floatValue())
                .withNumPredict(maxTokens);

        Prompt prompt = new Prompt(promptText, options);
        return chatModel.call(prompt).getResult().getOutput().getContent();
    }
}
