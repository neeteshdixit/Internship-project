package com.whatsappclone.controller;

import com.whatsappclone.service.ConversationVanishModeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping({"/api/vanish-mode", "/api/vanish"})
@RequiredArgsConstructor
public class ConversationVanishModeController {

    private final ConversationVanishModeService vanishModeService;

    @GetMapping("/direct/{peerUsername}")
    public ResponseEntity<Map<String, Object>> getDirectState(@PathVariable String peerUsername, Principal principal) {
        return ResponseEntity.ok(vanishModeService.getDirectState(principal.getName(), peerUsername));
    }

    @PostMapping("/direct/{peerUsername}")
    public ResponseEntity<Map<String, Object>> updateDirectState(
            @PathVariable String peerUsername,
            @RequestBody Map<String, Object> body,
            Principal principal
    ) {
        boolean enabled = extractEnabled(body);
        return ResponseEntity.ok(vanishModeService.updateDirectState(principal.getName(), peerUsername, enabled));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<Map<String, Object>> getGroupState(@PathVariable Long groupId, Principal principal) {
        return ResponseEntity.ok(vanishModeService.getGroupState(principal.getName(), groupId));
    }

    @PostMapping("/group/{groupId}")
    public ResponseEntity<Map<String, Object>> updateGroupState(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body,
            Principal principal
    ) {
        boolean enabled = extractEnabled(body);
        return ResponseEntity.ok(vanishModeService.updateGroupState(principal.getName(), groupId, enabled));
    }

    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggleVanish(
            @RequestBody Map<String, Object> body,
            Principal principal
    ) {
        boolean enabled = extractEnabled(body);
        if (body != null && body.containsKey("groupId") && body.get("groupId") != null) {
            Long groupId = Long.valueOf(String.valueOf(body.get("groupId")));
            return ResponseEntity.ok(vanishModeService.updateGroupState(principal.getName(), groupId, enabled));
        } else if (body != null && (body.containsKey("targetUsername") || body.containsKey("peerUsername"))) {
            String target = String.valueOf(body.containsKey("targetUsername") ? body.get("targetUsername") : body.get("peerUsername"));
            return ResponseEntity.ok(vanishModeService.updateDirectState(principal.getName(), target, enabled));
        }
        return ResponseEntity.badRequest().build();
    }

    private boolean extractEnabled(Map<String, Object> body) {
        Object enabled = body != null ? body.get("enabled") : null;
        if (enabled instanceof Boolean bool) {
            return bool;
        }
        return enabled != null && Boolean.parseBoolean(String.valueOf(enabled));
    }
}
