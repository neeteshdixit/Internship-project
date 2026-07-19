package com.whatsappclone.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import com.whatsappclone.repo.UserRepository;
import java.time.LocalDateTime;

import java.util.Set;
import java.util.Map;
import java.util.HashSet;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class PresenceService {

    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    // Track active session IDs per user: username (lowercase) -> Set of WebSocket Session IDs
    private final Map<String, Set<String>> userSessions = new ConcurrentHashMap<>();

    // Pending offline transitions: username (lowercase) -> Scheduled check task
    private final Map<String, ScheduledFuture<?>> pendingOfflineChecks = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);

    private static final long GRACE_PERIOD_SECONDS = 4;

    public PresenceService(SimpMessagingTemplate messagingTemplate, UserRepository userRepository) {
        this.messagingTemplate = messagingTemplate;
        this.userRepository = userRepository;
    }

    public void userOnline(String username, String sessionId) {
        if (username == null || sessionId == null) return;
        String key = username.toLowerCase().trim();

        log.info("User {} connected session {}", key, sessionId);

        // Cancel any pending offline transitions for this user since they reconnected
        ScheduledFuture<?> future = pendingOfflineChecks.remove(key);
        if (future != null) {
            future.cancel(false);
            log.info("Cancelled pending offline transition check for user {} (reconnected)", key);
        }

        Set<String> sessions = userSessions.computeIfAbsent(key, k -> ConcurrentHashMap.newKeySet());
        boolean wasOffline = sessions.isEmpty();
        sessions.add(sessionId);

        if (wasOffline) {
            // Only update UI status text if the user was fully offline
            broadcastPresenceUpdate(username, true);
            log.info("Presence Update: {} is ONLINE", username);
        }
    }

    public void userOffline(String username, String sessionId) {
        if (username == null || sessionId == null) return;
        String key = username.toLowerCase().trim();

        log.info("User {} disconnected session {}", key, sessionId);

        Set<String> sessions = userSessions.get(key);
        if (sessions != null) {
            sessions.remove(sessionId);
            if (sessions.isEmpty()) {
                userSessions.remove(key);

                // Schedule offline transition check with grace period to handle rapid refreshes
                ScheduledFuture<?> future = scheduler.schedule(() -> {
                    try {
                        performOfflineTransition(username);
                    } catch (Exception e) {
                        log.error("Error performing offline transition for user {}: {}", username, e.getMessage());
                    }
                }, GRACE_PERIOD_SECONDS, TimeUnit.SECONDS);

                pendingOfflineChecks.put(key, future);
                log.info("Scheduled offline transition check for user {} in {} seconds", key, GRACE_PERIOD_SECONDS);
            }
        }
    }

    private void performOfflineTransition(String username) {
        String key = username.toLowerCase().trim();
        pendingOfflineChecks.remove(key);

        // Double check they didn't establish a new session in the meantime
        Set<String> sessions = userSessions.get(key);
        if (sessions == null || sessions.isEmpty()) {
            updateUserLastSeen(username);
            broadcastPresenceUpdate(username, false);
            log.info("Presence Update: {} is OFFLINE (grace period passed)", username);
        }
    }

    private void updateUserLastSeen(String username) {
        try {
            userRepository.findByUsernameIgnoreCase(username).ifPresent(user -> {
                user.setLastSeen(LocalDateTime.now());
                userRepository.save(user);
            });
        } catch (Exception e) {
            log.error("Failed to update lastSeen in database for user {}: {}", username, e.getMessage());
        }
    }

    public boolean isUserOnline(String username) {
        if (username == null) return false;
        String key = username.toLowerCase().trim();

        Set<String> sessions = userSessions.get(key);
        return sessions != null && !sessions.isEmpty();
    }

    public Set<String> getOnlineUsers() {
        Set<String> onlineList = new HashSet<>();
        userSessions.forEach((user, sessions) -> {
            if (sessions != null && !sessions.isEmpty()) {
                onlineList.add(user);
            }
        });
        return onlineList;
    }

    private void broadcastPresenceUpdate(String username, boolean isOnline) {
        messagingTemplate.convertAndSend("/topic/presence", new PresenceUpdate(username, isOnline));
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String username = (String) headers.getSessionAttributes().get("username");
        String sessionId = headers.getSessionId();
        if (username != null && sessionId != null) {
            userOffline(username, sessionId);
        }
    }

    public static record PresenceUpdate(String username, boolean isOnline) {}
}
