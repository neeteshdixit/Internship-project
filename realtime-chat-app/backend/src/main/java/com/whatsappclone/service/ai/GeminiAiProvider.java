package com.whatsappclone.service.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import java.util.Map;
import java.util.List;
import java.util.HashMap;

@Component
public class GeminiAiProvider implements AIProvider {

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String getName() {
        return "Gemini";
    }

    @Override
    public boolean isLocal() {
        return false;
    }

    @Override
    public boolean isAvailable() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Override
    public String generate(String promptText) {
        if (!isAvailable()) {
            return "Gemini Cloud Simulation: [No API key configured. Mock response for prompt: '" + 
                   (promptText.length() > 50 ? promptText.substring(0, 50) + "..." : promptText) + "']";
        }
        try {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
            
            Map<String, Object> part = new HashMap<>();
            part.put("text", promptText);
            
            Map<String, Object> content = new HashMap<>();
            content.put("parts", List.of(part));
            
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", List.of(content));

            Map<String, Object> response = restTemplate.postForObject(url, requestBody, Map.class);
            if (response != null && response.containsKey("candidates")) {
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
                if (!candidates.isEmpty()) {
                    Map<String, Object> firstCandidate = candidates.get(0);
                    Map<String, Object> contentObj = (Map<String, Object>) firstCandidate.get("content");
                    List<Map<String, Object>> parts = (List<Map<String, Object>>) contentObj.get("parts");
                    if (!parts.isEmpty()) {
                        return (String) parts.get(0).get("text");
                    }
                }
            }
            return "Failed to parse response from Gemini API.";
        } catch (Exception e) {
            return "Gemini Cloud Error: " + e.getMessage();
        }
    }
}
