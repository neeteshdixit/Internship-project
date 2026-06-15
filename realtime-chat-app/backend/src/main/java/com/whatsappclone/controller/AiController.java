package com.whatsappclone.controller;

import com.whatsappclone.model.Message;
import com.whatsappclone.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final MessageService messageService;
    private final ChatModel chatModel;

    @GetMapping("/summarize/{username1}/{username2}")
    public ResponseEntity<String> getConversationSummary(
            @PathVariable String username1,
            @PathVariable String username2
    ) {
        List<Message> history = messageService.getChatHistory(username1, username2);
        if (history.isEmpty()) {
            return ResponseEntity.ok("No conversation history found to summarize.");
        }

        StringBuilder transcript = new StringBuilder();
        for (Message msg : history) {
            transcript.append(msg.getSender().getUsername())
                      .append(": ")
                      .append(msg.getContent())
                      .append("\n");
        }

        String prompt = "Here is a chat conversation between two users. Please provide a concise summary with key insights, action items, and recommendations in bullet points:\n\n" + transcript.toString();

        try {
            String summary = chatModel.call(prompt);
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error invoking local Ollama engine: " + e.getMessage() + ". Make sure Ollama server is running (ollama run phi3).");
        }
    }
}
