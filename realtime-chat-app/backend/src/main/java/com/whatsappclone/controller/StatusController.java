package com.whatsappclone.controller;

import com.whatsappclone.model.Contact;
import com.whatsappclone.model.Status;
import com.whatsappclone.model.User;
import com.whatsappclone.repo.ContactRepository;
import com.whatsappclone.repo.StatusRepository;
import com.whatsappclone.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/statuses")
@RequiredArgsConstructor
public class StatusController {

    private final StatusRepository statusRepository;
    private final ContactRepository contactRepository;
    private final UserRepository userRepository;

    // Post a new status (valid for 24 hours)
    @PostMapping
    public ResponseEntity<?> postStatus(@RequestBody Map<String, String> request, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User user = userRepository.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        String mediaUrl = request.get("mediaUrl");
        if (mediaUrl == null || mediaUrl.isEmpty()) {
            mediaUrl = request.get("content");
        }
        String caption = request.get("caption");
        if (caption == null || caption.isEmpty()) {
            caption = request.get("content");
        }
        String type = request.getOrDefault("type", "text").toLowerCase();
        String textBackground = request.get("textBackground");
        if (textBackground == null || textBackground.isEmpty()) {
            textBackground = request.get("backgroundColor");
        }

        LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

        Status status = new Status(user, mediaUrl, caption, type, textBackground, expiresAt);
        Status saved = statusRepository.save(status);

        return ResponseEntity.ok(Map.of("id", saved.getId(), "message", "Status posted successfully"));
    }

    // Get active statuses of contacts and self
    @GetMapping
    public ResponseEntity<?> getActiveStatuses(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User me = userRepository.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (me == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        List<Contact> contacts = contactRepository.findByOwner(me);
        List<User> targetUsers = contacts.stream()
                .map(Contact::getContactUser)
                .collect(Collectors.toList());
        targetUsers.add(me); // add self to see own statuses

        LocalDateTime now = LocalDateTime.now();
        List<Status> activeStatuses = statusRepository.findByUserInAndExpiresAtAfterOrderByCreatedAtAsc(targetUsers, now);

        // Group by user
        Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
        Map<String, String> userAvatars = new HashMap<>();

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        for (Status s : activeStatuses) {
            String username = s.getUser().getUsername();
            userAvatars.putIfAbsent(username, s.getUser().getProfilePicUrl() != null 
                    ? s.getUser().getProfilePicUrl() 
                    : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100");

            Map<String, Object> update = new HashMap<>();
            update.put("id", s.getId());
            update.put("mediaUrl", s.getMediaUrl());
            update.put("caption", s.getCaption());
            update.put("type", s.getType());
            update.put("textBackground", s.getTextBackground());
            update.put("createdAt", s.getCreatedAt().format(formatter));
            update.put("viewers", s.getViewers());
            update.put("viewsCount", s.getViewers().size());

            grouped.computeIfAbsent(username, k -> new ArrayList<>()).add(update);
        }

        List<Map<String, Object>> responseList = new ArrayList<>();
        for (Map.Entry<String, List<Map<String, Object>>> entry : grouped.entrySet()) {
            Map<String, Object> groupMap = new HashMap<>();
            groupMap.put("username", entry.getKey());
            groupMap.put("avatar", userAvatars.get(entry.getKey()));
            groupMap.put("updates", entry.getValue());
            responseList.add(groupMap);
        }

        return ResponseEntity.ok(responseList);
    }

    // Get only current user's active statuses
    @GetMapping("/mine")
    public ResponseEntity<?> getMyStatuses(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        User me = userRepository.findByUsernameIgnoreCase(principal.getName()).orElse(null);
        if (me == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        LocalDateTime now = LocalDateTime.now();
        List<Status> myStatuses = statusRepository.findByUserAndExpiresAtAfterOrderByCreatedAtAsc(me, now);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        List<Map<String, Object>> list = new ArrayList<>();
        for (Status s : myStatuses) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", s.getId());
            item.put("mediaUrl", s.getMediaUrl());
            item.put("caption", s.getCaption());
            item.put("type", s.getType());
            item.put("textBackground", s.getTextBackground());
            item.put("createdAt", s.getCreatedAt().format(formatter));
            item.put("viewers", s.getViewers());
            item.put("viewsCount", s.getViewers().size());
            list.add(item);
        }

        return ResponseEntity.ok(list);
    }

    // Record a view on a status
    @PostMapping("/{id}/view")
    public ResponseEntity<?> recordView(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Status status = statusRepository.findById(id).orElse(null);
        if (status == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Status not found"));
        }
        status.getViewers().add(principal.getName());
        statusRepository.save(status);
        return ResponseEntity.ok(Map.of("message", "View recorded", "viewsCount", status.getViewers().size()));
    }

    // Delete a status
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStatus(@PathVariable Long id, Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        Status status = statusRepository.findById(id).orElse(null);
        if (status == null) {
            return ResponseEntity.status(404).body(Map.of("error", "Status not found"));
        }
        if (!status.getUser().getUsername().equalsIgnoreCase(principal.getName())) {
            return ResponseEntity.status(403).body(Map.of("error", "Forbidden"));
        }
        statusRepository.delete(status);
        return ResponseEntity.ok(Map.of("message", "Status deleted successfully", "id", id));
    }
}
