package com.whatsappclone.service;

import com.whatsappclone.dto.AiReportResponse;
import com.whatsappclone.service.ai.AIProvider;
import com.whatsappclone.service.ai.AiProviderManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AiService {

    private final AiProviderManager aiProviderManager;
    private final PromptManager promptManager;

    private AiReportResponse executeWithReport(String promptText) {
        long startTime = System.currentTimeMillis();
        AIProvider provider = aiProviderManager.selectProvider();
        
        if (provider == null) {
            double duration = (System.currentTimeMillis() - startTime) / 1000.0;
            return AiReportResponse.builder()
                    .responseText("AI features are unavailable because no local AI provider is available and Cloud AI is disabled.")
                    .provider("None")
                    .processingMode("N/A")
                    .sentOutsideDevice(false)
                    .temporaryBufferReleased(true)
                    .processingTimeSeconds(duration)
                    .status("Unavailable")
                    .build();
        }

        try {
            String responseText = provider.generate(promptText);
            double duration = (System.currentTimeMillis() - startTime) / 1000.0;
            return AiReportResponse.builder()
                    .responseText(responseText)
                    .provider(provider.getName())
                    .processingMode(provider.isLocal() ? "Local" : "Cloud")
                    .sentOutsideDevice(!provider.isLocal())
                    .temporaryBufferReleased(true)
                    .processingTimeSeconds(duration)
                    .status("Completed")
                    .build();
        } catch (Exception e) {
            double duration = (System.currentTimeMillis() - startTime) / 1000.0;
            return AiReportResponse.builder()
                    .responseText("Error generating response: " + e.getMessage())
                    .provider(provider.getName())
                    .processingMode(provider.isLocal() ? "Local" : "Cloud")
                    .sentOutsideDevice(!provider.isLocal())
                    .temporaryBufferReleased(true)
                    .processingTimeSeconds(duration)
                    .status("Failed")
                    .build();
        }
    }

    public AiReportResponse getChatSummary(String transcript) {
        return executeWithReport(promptManager.getSummarizePrompt(transcript));
    }

    public AiReportResponse getSmartReplies(String transcript) {
        return executeWithReport(promptManager.getSmartReplyPrompt(transcript));
    }

    public AiReportResponse rewriteMessage(String message, String mode) {
        return executeWithReport(promptManager.getRewritePrompt(message, mode));
    }

    public AiReportResponse correctGrammar(String message) {
        return executeWithReport(promptManager.getGrammarPrompt(message));
    }

    public AiReportResponse translateMessage(String message, String targetLanguage) {
        return executeWithReport(promptManager.getTranslatePrompt(message, targetLanguage));
    }

    public AiReportResponse extractActionItems(String transcript) {
        return executeWithReport(promptManager.getActionItemsPrompt(transcript));
    }

    public AiReportResponse detectMeeting(String transcript) {
        return executeWithReport(promptManager.getMeetingPrompt(transcript));
    }

    public AiReportResponse detectReminder(String transcript) {
        return executeWithReport(promptManager.getReminderPrompt(transcript));
    }

    public AiReportResponse generateChatTitle(String transcript) {
        return executeWithReport(promptManager.getChatTitlePrompt(transcript));
    }

    public AiReportResponse detectMood(String transcript) {
        return executeWithReport(promptManager.getMoodPrompt(transcript));
    }

    public AiReportResponse convertToNotes(String messages) {
        return executeWithReport(promptManager.getNotesPrompt(messages));
    }

    public AiReportResponse explainMessage(String message, String level) {
        return executeWithReport(promptManager.getExplainPrompt(message, level));
    }

    public AiReportResponse generateEmail(String transcript) {
        return executeWithReport(promptManager.getEmailPrompt(transcript));
    }

    public AiReportResponse improveMessage(String message) {
        return executeWithReport(promptManager.getImprovePrompt(message));
    }

    public AiReportResponse generateDailySummary(String context) {
        return executeWithReport(promptManager.getDailySummaryPrompt(context));
    }

    /**
     * Conversational chat with the AI assistant.
     */
    public AiReportResponse chat(String history, String userMessage) {
        String prompt = "You are a helpful AI assistant embedded inside a WhatsApp-like chat application. "
                + "Answer naturally and conversationally. Be concise but thorough.\n\n";
        if (history != null && !history.isBlank()) {
            prompt += "Conversation so far:\n" + history + "\n\n";
        }
        prompt += "User: " + userMessage + "\nAssistant:";
        return executeWithReport(prompt);
    }
}
