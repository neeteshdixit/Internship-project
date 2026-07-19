package com.whatsappclone.controller;

import com.whatsappclone.dto.AiRequestDto;
import com.whatsappclone.dto.AiReportResponse;
import com.whatsappclone.model.Message;
import com.whatsappclone.model.AiSettings;
import com.whatsappclone.service.AiService;
import com.whatsappclone.service.MessageService;
import com.whatsappclone.service.ai.AiProviderManager;
import com.whatsappclone.service.ai.AIProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class AiController {

    private final MessageService messageService;
    private final AiService aiService;
    private final AiProviderManager aiProviderManager;

    @GetMapping("/settings")
    public ResponseEntity<AiSettings> getSettings() {
        return ResponseEntity.ok(aiProviderManager.getSettings());
    }

    @PostMapping("/settings")
    public ResponseEntity<AiSettings> saveSettings(@RequestBody AiSettings settings) {
        return ResponseEntity.ok(aiProviderManager.saveSettings(settings));
    }

    @GetMapping("/preflight")
    public ResponseEntity<Map<String, Object>> getPreflight() {
        AIProvider provider = aiProviderManager.selectProvider();
        AiSettings settings = aiProviderManager.getSettings();
        
        boolean requiresPermission = false;
        String providerName = "None";
        boolean isCloud = false;

        if (provider != null) {
            providerName = provider.getName();
            isCloud = !provider.isLocal();
            if (isCloud) {
                requiresPermission = settings.isAskPermissionEveryTime() && !settings.isAlwaysAllowCloud();
            }
        }

        return ResponseEntity.ok(Map.of(
            "providerName", providerName,
            "isCloud", isCloud,
            "requiresPermission", requiresPermission
        ));
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        AIProvider provider = aiProviderManager.selectProvider();
        
        String providerName = provider != null ? provider.getName() : "None";
        String mode = provider != null ? (provider.isLocal() ? "Local" : "Cloud") : "N/A";
        boolean cloudUsed = provider != null && !provider.isLocal();
        double responseTime = provider != null ? (provider.isLocal() ? 1.2 : 2.5) : 0.0;

        return ResponseEntity.ok(Map.of(
            "providerName", providerName,
            "processingMode", mode,
            "isCloud", cloudUsed,
            "storedByApp", "NO",
            "temporaryBuffer", "Cleared After Processing",
            "responseTimeSeconds", responseTime,
            "status", provider != null ? "Active" : "Unavailable"
        ));
    }

    @GetMapping("/summarize/{username1}/{username2}")
    public ResponseEntity<AiReportResponse> getConversationSummary(
            @PathVariable String username1,
            @PathVariable String username2
    ) {
        List<Message> history = messageService.getChatHistory(username1, username2);
        if (history.isEmpty()) {
            return ResponseEntity.ok(AiReportResponse.builder()
                    .responseText("No conversation history found to summarize.")
                    .provider("None")
                    .processingMode("N/A")
                    .sentOutsideDevice(false)
                    .temporaryBufferReleased(true)
                    .processingTimeSeconds(0.0)
                    .status("Completed")
                    .build());
        }

        StringBuilder transcript = new StringBuilder();
        for (Message msg : history) {
            transcript.append(msg.getSender().getUsername())
                      .append(": ")
                      .append(msg.getContent())
                      .append("\n");
        }

        AiReportResponse summary = aiService.getChatSummary(transcript.toString());
        return ResponseEntity.ok(summary);
    }

    @PostMapping("/summarize")
    public ResponseEntity<AiReportResponse> postSummarize(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.getChatSummary(dto.getText());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/smart-reply")
    public ResponseEntity<AiReportResponse> postSmartReplies(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.getSmartReplies(dto.getText());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/rewrite")
    public ResponseEntity<AiReportResponse> postRewrite(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.rewriteMessage(dto.getText(), dto.getParam());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/grammar")
    public ResponseEntity<AiReportResponse> postGrammar(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.correctGrammar(dto.getText());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/translate")
    public ResponseEntity<AiReportResponse> postTranslate(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.translateMessage(dto.getText(), dto.getParam());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/tasks")
    public ResponseEntity<AiReportResponse> postActionItems(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.extractActionItems(dto.getText());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/meetings")
    public ResponseEntity<AiReportResponse> postMeetings(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.detectMeeting(dto.getText());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/reminders")
    public ResponseEntity<AiReportResponse> postReminders(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.detectReminder(dto.getText());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/title")
    public ResponseEntity<AiReportResponse> postTitle(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.generateChatTitle(dto.getText());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/mood")
    public ResponseEntity<AiReportResponse> postMood(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.detectMood(dto.getText());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/notes")
    public ResponseEntity<AiReportResponse> postNotes(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.convertToNotes(dto.getText());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/explain")
    public ResponseEntity<AiReportResponse> postExplain(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.explainMessage(dto.getText(), dto.getParam());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/email")
    public ResponseEntity<AiReportResponse> postEmail(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.generateEmail(dto.getText());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/improve")
    public ResponseEntity<AiReportResponse> postImprove(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.improveMessage(dto.getText());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/daily-summary")
    public ResponseEntity<AiReportResponse> postDailySummary(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.generateDailySummary(dto.getText());
        return ResponseEntity.ok(res);
    }

    @PostMapping("/chat")
    public ResponseEntity<AiReportResponse> postChat(@RequestBody AiRequestDto dto) {
        AiReportResponse res = aiService.chat(dto.getParam(), dto.getText());
        return ResponseEntity.ok(res);
    }
}
