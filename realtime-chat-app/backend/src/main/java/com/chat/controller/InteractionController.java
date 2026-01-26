package com.chat.controller;

import com.chat.model.Interaction;
import com.chat.service.InteractionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interactions")
@RequiredArgsConstructor
@Slf4j
public class InteractionController {

    private final InteractionService interactionService;

    @PostMapping
    public ResponseEntity<Interaction> recordInteraction(@RequestBody Map<String, Object> payload) {
        try {
            Interaction interaction = interactionService.recordInteraction(
                    ((Number) payload.get("customerId")).longValue(),
                    ((Number) payload.get("userId")).longValue(),
                    (String) payload.get("type"),
                    (String) payload.get("notes")
            );
            log.info("Interaction recorded: {}", interaction.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(interaction);
        } catch (Exception e) {
            log.error("Error recording interaction: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Interaction> getInteractionById(@PathVariable Long id) {
        try {
            Interaction interaction = interactionService.getInteractionById(id);
            return ResponseEntity.ok(interaction);
        } catch (Exception e) {
            log.error("Error fetching interaction: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Interaction>> getCustomerInteractions(@PathVariable Long customerId) {
        try {
            List<Interaction> interactions = interactionService.getCustomerInteractions(customerId);
            return ResponseEntity.ok(interactions);
        } catch (Exception e) {
            log.error("Error fetching customer interactions: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Interaction>> getUserInteractions(@PathVariable Long userId) {
        try {
            List<Interaction> interactions = interactionService.getUserInteractions(userId);
            return ResponseEntity.ok(interactions);
        } catch (Exception e) {
            log.error("Error fetching user interactions: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<Interaction>> getInteractionsByType(@PathVariable String type) {
        try {
            List<Interaction> interactions = interactionService.getInteractionsByType(type);
            return ResponseEntity.ok(interactions);
        } catch (Exception e) {
            log.error("Error fetching interactions by type: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Interaction> updateInteraction(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload) {
        try {
            Interaction updated = interactionService.updateInteraction(
                    id,
                    payload.get("type"),
                    payload.get("notes"),
                    payload.get("outcome")
            );
            log.info("Interaction updated: {}", id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating interaction: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{id}/follow-up")
    public ResponseEntity<Void> setFollowUpDate(
            @PathVariable Long id,
            @RequestParam String nextFollowUpDate) {
        try {
            interactionService.setFollowUpDate(id, LocalDateTime.parse(nextFollowUpDate));
            log.info("Follow-up date set for interaction: {}", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error setting follow-up date: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInteraction(@PathVariable Long id) {
        try {
            interactionService.deleteInteraction(id);
            log.info("Interaction deleted: {}", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting interaction: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
