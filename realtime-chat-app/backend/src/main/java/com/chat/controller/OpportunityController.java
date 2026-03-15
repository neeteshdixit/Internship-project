package com.chat.controller;

import com.chat.model.Opportunity;
import com.chat.service.OpportunityService;
import com.chat.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/opportunities")
@RequiredArgsConstructor
@Slf4j
public class OpportunityController {

    private final OpportunityService opportunityService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Opportunity> createOpportunity(@RequestBody Map<String, Object> payload, Principal principal) {
        try {
            Long currentUserId = userService.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getId();
            Opportunity opportunity = opportunityService.createOpportunity(
                    ((Number) payload.get("customerId")).longValue(),
                    currentUserId,
                    (String) payload.get("title"),
                    new BigDecimal(payload.get("value").toString()),
                    LocalDateTime.parse((String) payload.get("expectedCloseDate"))
            );
            log.info("Opportunity created: {} by owner", opportunity.getTitle());
            return ResponseEntity.status(HttpStatus.CREATED).body(opportunity);
        } catch (Exception e) {
            log.error("Error creating opportunity: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Opportunity> getOpportunityById(@PathVariable Long id) {
        try {
            Opportunity opportunity = opportunityService.getOpportunityById(id);
            return ResponseEntity.ok(opportunity);
        } catch (Exception e) {
            log.error("Error fetching opportunity: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<Opportunity>> getCustomerOpportunities(@PathVariable Long customerId) {
        try {
            List<Opportunity> opportunities = opportunityService.getCustomerOpportunities(customerId);
            return ResponseEntity.ok(opportunities);
        } catch (Exception e) {
            log.error("Error fetching customer opportunities: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Opportunity>> getOwnerOpportunities(@PathVariable Long ownerId, Principal principal) {
        try {
            if (!isSelfOrAdmin(ownerId, principal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            List<Opportunity> opportunities = opportunityService.getOwnerOpportunities(ownerId);
            return ResponseEntity.ok(opportunities);
        } catch (Exception e) {
            log.error("Error fetching owner opportunities: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/stage/{stage}")
    public ResponseEntity<List<Opportunity>> getOpportunitiesByStage(@PathVariable String stage) {
        try {
            List<Opportunity> opportunities = opportunityService.getOpportunitiesByStage(stage);
            return ResponseEntity.ok(opportunities);
        } catch (Exception e) {
            log.error("Error fetching opportunities by stage: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/closed")
    public ResponseEntity<List<Opportunity>> getClosedOpportunities() {
        try {
            List<Opportunity> opportunities = opportunityService.getClosedOpportunities();
            return ResponseEntity.ok(opportunities);
        } catch (Exception e) {
            log.error("Error fetching closed opportunities: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/open")
    public ResponseEntity<Page<Opportunity>> getOpenOpportunities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<Opportunity> opportunities = opportunityService.getOpenOpportunities(pageable);
            return ResponseEntity.ok(opportunities);
        } catch (Exception e) {
            log.error("Error fetching open opportunities: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}/stage")
    public ResponseEntity<Opportunity> updateOpportunityStage(
            @PathVariable Long id,
            @RequestParam String stage,
            @RequestParam Integer probability,
            Principal principal) {
        try {
            Opportunity existing = opportunityService.getOpportunityById(id);
            if (!isSelfOrAdmin(existing.getOwner().getId(), principal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Opportunity updated = opportunityService.updateOpportunityStage(id, stage, probability);
            log.info("Opportunity {} stage updated to: {}", id, stage);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating opportunity stage: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{id}/win")
    public ResponseEntity<Opportunity> winOpportunity(
            @PathVariable Long id,
            @RequestParam BigDecimal actualValue,
            Principal principal) {
        try {
            Opportunity existing = opportunityService.getOpportunityById(id);
            if (!isSelfOrAdmin(existing.getOwner().getId(), principal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Opportunity updated = opportunityService.winOpportunity(id, actualValue);
            log.info("Opportunity {} marked as WON", id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error marking opportunity as won: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{id}/lose")
    public ResponseEntity<Opportunity> loseOpportunity(
            @PathVariable Long id,
            @RequestParam String reason,
            Principal principal) {
        try {
            Opportunity existing = opportunityService.getOpportunityById(id);
            if (!isSelfOrAdmin(existing.getOwner().getId(), principal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Opportunity updated = opportunityService.loseOpportunity(id, reason);
            log.info("Opportunity {} marked as LOST", id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error marking opportunity as lost: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Opportunity> updateOpportunity(
            @PathVariable Long id,
            @RequestBody Opportunity details,
            Principal principal) {
        try {
            Opportunity existing = opportunityService.getOpportunityById(id);
            if (!isSelfOrAdmin(existing.getOwner().getId(), principal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Opportunity updated = opportunityService.updateOpportunity(id, details);
            log.info("Opportunity updated: {}", id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            log.error("Error updating opportunity: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOpportunity(@PathVariable Long id, Principal principal) {
        try {
            Opportunity existing = opportunityService.getOpportunityById(id);
            if (!isSelfOrAdmin(existing.getOwner().getId(), principal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            opportunityService.deleteOpportunity(id);
            log.info("Opportunity deleted: {}", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting opportunity: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/analytics/won-value")
    public ResponseEntity<Double> getTotalWonValue() {
        try {
            Double total = opportunityService.getTotalWonValue();
            return ResponseEntity.ok(total != null ? total : 0.0);
        } catch (Exception e) {
            log.error("Error calculating won value: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/analytics/pipeline-value")
    public ResponseEntity<Double> getTotalPipelineValue() {
        try {
            Double total = opportunityService.getTotalPipelineValue();
            return ResponseEntity.ok(total != null ? total : 0.0);
        } catch (Exception e) {
            log.error("Error calculating pipeline value: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    private boolean isSelfOrAdmin(Long targetUserId, Principal principal) {
        com.chat.model.User currentUser = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(role -> "ROLE_ADMIN".equals(role.getName()));
        return isAdmin || currentUser.getId().equals(targetUserId);
    }
}
