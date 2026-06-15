package com.whatsappclone.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

@Service
@Slf4j
public class PresenceService {

    private final Set<String> onlineUsers = Collections.synchronizedSet(new HashSet<>());
    private final SimpMessagingTemplate messagingTemplate;

    public PresenceService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void userOnline(String username) {
        if (username != null) {
            onlineUsers.add(username);
            broadcastPresenceUpdate(username, true);
            log.info("Presence Update: {} is ONLINE", username);
        }
    }

    public void userOffline(String username) {
        if (username != null) {
            onlineUsers.remove(username);
            broadcastPresenceUpdate(username, false);
            log.info("Presence Update: {} is OFFLINE", username);
        }
    }

    public boolean isUserOnline(String username) {
        return onlineUsers.contains(username);
    }

    public Set<String> getOnlineUsers() {
        return new HashSet<>(onlineUsers);
    }

    private void broadcastPresenceUpdate(String username, boolean isOnline) {
        messagingTemplate.convertAndSend("/topic/presence", new PresenceUpdate(username, isOnline));
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String username = (String) headers.getSessionAttributes().get("username");
        if (username != null) {
            userOffline(username);
        }
    }

    public static record PresenceUpdate(String username, boolean isOnline) {}
}
