package com.whatsappclone.service.ai;

public interface AIProvider {
    String getName();
    boolean isLocal();
    boolean isAvailable();
    String generate(String promptText);
}
