package com.whatsappclone.service;

import org.springframework.stereotype.Service;

@Service
public class PromptManager {

    public String getSummarizePrompt(String transcript) {
        return "You are an expert chat analyzer. Provide a concise summary of the following conversation with: "
                + "\n- Bullet Summary"
                + "\n- Key Points"
                + "\n- Important Decisions"
                + "\n\nConversation:\n" + transcript;
    }

    public String getSmartReplyPrompt(String transcript) {
        return "Analyze the following chat conversation history and suggest exactly 3 context-aware, short, natural smart replies for the next message from the sender's perspective. "
                + "Do not use placeholders, do not number them in the output, and do not add any conversational text. Return exactly 3 replies, one per line. "
                + "\n\nConversation:\n" + transcript;
    }

    public String getRewritePrompt(String message, String mode) {
        return "You are a professional copywriter. Rewrite the following message to sound " + mode.toUpperCase() + ". "
                + "Keep the original meaning but change the tone accordingly: "
                + "\n\nMessage: " + message;
    }

    public String getGrammarPrompt(String message) {
        return "Correct any spelling or grammar mistakes in the following message. Return ONLY the corrected message without any quotes or explanations. If the message is already correct, return it as is: "
                + "\n\nMessage: " + message;
    }

    public String getTranslatePrompt(String message, String targetLanguage) {
        return "Translate the following message into " + targetLanguage + ". Return ONLY the translated text without any explanation or introductory remarks: "
                + "\n\nMessage: " + message;
    }

    public String getActionItemsPrompt(String transcript) {
        return "Analyze the following conversation and extract action items. Return a list of tasks including owner (if detected), priority, and deadline (if mentioned). Use bullet points: "
                + "\n\nConversation:\n" + transcript;
    }

    public String getMeetingPrompt(String transcript) {
        return "Analyze the following conversation and detect any meeting schedule. Return a structured JSON block containing: "
                + "\n{"
                + "\n  \"isMeeting\": boolean,"
                + "\n  \"meetingTitle\": \"string\","
                + "\n  \"date\": \"string\","
                + "\n  \"time\": \"string\","
                + "\n  \"location\": \"string\""
                + "\n}"
                + "\nReturn ONLY the raw JSON block without markdown formatting or other text: "
                + "\n\nConversation:\n" + transcript;
    }

    public String getReminderPrompt(String transcript) {
        return "Analyze the following message/conversation and extract any reminder-worthy tasks. Return a structured JSON containing: "
                + "\n{"
                + "\n  \"isReminder\": boolean,"
                + "\n  \"title\": \"string\","
                + "\n  \"time\": \"string\","
                + "\n  \"description\": \"string\""
                + "\n}"
                + "\nReturn ONLY the raw JSON block without markdown formatting or other text: "
                + "\n\nConversation:\n" + transcript;
    }

    public String getChatTitlePrompt(String transcript) {
        return "Analyze the following conversation and generate a short, professional topic title for this chat. Return ONLY the title (maximum 4 words) without quotes or punctuation: "
                + "\n\nConversation:\n" + transcript;
    }

    public String getMoodPrompt(String transcript) {
        return "Analyze the emotional mood of the following conversation. Identify the primary mood from: Happy, Neutral, Sad, Angry, Urgent, Professional, Friendly. "
                + "Return a structured JSON with: "
                + "\n{"
                + "\n  \"mood\": \"string\","
                + "\n  \"confidenceScore\": double (between 0.0 and 1.0)"
                + "\n}"
                + "\nReturn ONLY the raw JSON block without markdown formatting or other text: "
                + "\n\nConversation:\n" + transcript;
    }

    public String getNotesPrompt(String messages) {
        return "Convert the following messages/conversation into clean, structured personal notes. Include headings, bullet points, and key details where appropriate: "
                + "\n\nContent:\n" + messages;
    }

    public String getExplainPrompt(String message, String level) {
        return "Explain the following technical or long text simply for a person at " + level.toUpperCase() + " level: "
                + "\n\nText: " + message;
    }

    public String getEmailPrompt(String transcript) {
        return "Convert the following conversation context into a professional email. Provide a Subject, Greeting, Body, and Closing: "
                + "\n\nConversation Context:\n" + transcript;
    }

    public String getImprovePrompt(String message) {
        return "Improve the readability and clarity of the following message without changing its original intent or meaning. Return ONLY the improved version: "
                + "\n\nMessage: " + message;
    }

    public String getDailySummaryPrompt(String context) {
        return "Generate a daily conversation and calling activity summary based on the following logs. Summarize messages sent, calls made, meetings discussed, pending tasks, and provide an overall summary using bullet points: "
                + "\n\nLogs Context:\n" + context;
    }
}
