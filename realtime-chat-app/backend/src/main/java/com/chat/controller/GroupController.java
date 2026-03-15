package com.chat.controller;

import com.chat.model.Group;
import com.chat.model.User;
import com.chat.service.GroupService;
import com.chat.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Slf4j
public class GroupController {

    private final GroupService groupService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<Group> createGroup(@RequestBody Map<String, String> payload, Principal principal) {
        try {
            Long creatorId = userService.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getId();

            Group group = groupService.createGroup(creatorId, payload.get("name"), payload.get("description"));
            log.info("Group created: {} by user: {}", group.getName(), principal.getName());
            return ResponseEntity.status(HttpStatus.CREATED).body(group);
        } catch (Exception e) {
            log.error("Error creating group: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroupById(@PathVariable Long id) {
        try {
            Group group = groupService.getGroupById(id);
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            log.error("Error fetching group: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/user/my-groups")
    public ResponseEntity<List<Group>> getUserGroups(Principal principal) {
        try {
            Long userId = userService.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("User not found"))
                    .getId();

            List<Group> groups = groupService.getUserGroups(userId);
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            log.error("Error fetching user groups: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/search")
    public ResponseEntity<List<Group>> searchGroups(@RequestParam String keyword) {
        try {
            List<Group> groups = groupService.searchGroups(keyword);
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            log.error("Error searching groups: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/all-active")
    public ResponseEntity<List<Group>> getAllActiveGroups() {
        try {
            List<Group> groups = groupService.getAllActiveGroups();
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            log.error("Error fetching active groups: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> addMemberToGroup(@PathVariable Long groupId, @PathVariable Long userId, Principal principal) {
        try {
            if (!canManageMembership(groupId, userId, principal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            groupService.addMemberToGroup(groupId, userId);
            log.info("User {} added to group: {}", userId, groupId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error adding member to group: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{groupId}/members/{userId}")
    public ResponseEntity<Void> removeMemberFromGroup(@PathVariable Long groupId, @PathVariable Long userId, Principal principal) {
        try {
            if (!canManageMembership(groupId, userId, principal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            groupService.removeMemberFromGroup(groupId, userId);
            log.info("User {} removed from group: {}", userId, groupId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error removing member from group: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<Group> updateGroup(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload,
            Principal principal) {
        try {
            if (!isGroupCreatorOrAdmin(id, principal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            Group updatedGroup = groupService.updateGroup(id, payload.get("name"), payload.get("description"));
            log.info("Group updated: {}", id);
            return ResponseEntity.ok(updatedGroup);
        } catch (Exception e) {
            log.error("Error updating group: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PostMapping("/{id}/archive")
    public ResponseEntity<Void> archiveGroup(@PathVariable Long id, Principal principal) {
        try {
            if (!isGroupCreatorOrAdmin(id, principal)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            groupService.archiveGroup(id);
            log.info("Group archived: {}", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error archiving group: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id) {
        try {
            groupService.deleteGroup(id);
            log.info("Group deleted: {}", id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error deleting group: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping("/{groupId}/members/{userId}/check")
    public ResponseEntity<Boolean> isMember(@PathVariable Long groupId, @PathVariable Long userId) {
        try {
            Boolean isMember = groupService.isMemberOfGroup(userId, groupId);
            return ResponseEntity.ok(isMember);
        } catch (Exception e) {
            log.error("Error checking membership: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    private boolean canManageMembership(Long groupId, Long targetUserId, Principal principal) {
        User currentUser = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(role -> "ROLE_ADMIN".equals(role.getName()));
        return isAdmin || currentUser.getId().equals(targetUserId) || isGroupCreator(groupId, currentUser.getId());
    }

    private boolean isGroupCreatorOrAdmin(Long groupId, Principal principal) {
        User currentUser = userService.findByUsername(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        boolean isAdmin = currentUser.getRoles().stream()
                .anyMatch(role -> "ROLE_ADMIN".equals(role.getName()));
        return isAdmin || isGroupCreator(groupId, currentUser.getId());
    }

    private boolean isGroupCreator(Long groupId, Long userId) {
        Group group = groupService.getGroupById(groupId);
        return group.getCreatedBy() != null && userId.equals(group.getCreatedBy().getId());
    }
}
