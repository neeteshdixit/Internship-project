package com.whatsappclone.service;

import com.whatsappclone.model.ChatGroup;
import com.whatsappclone.model.User;
import com.whatsappclone.repo.ChatGroupRepository;
import com.whatsappclone.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatGroupService {

    private final ChatGroupRepository chatGroupRepository;
    private final UserRepository userRepository;

    @Transactional
    public ChatGroup createGroup(String name, String avatar, String creatorUsername, List<?> memberIdentifiers) {
        User creator = userRepository.findByUsernameIgnoreCase(creatorUsername)
                .orElseThrow(() -> new IllegalArgumentException("Creator not found: " + creatorUsername));

        Set<User> members = new HashSet<>();
        members.add(creator); // Creator is automatically a member

        if (memberIdentifiers != null) {
            for (Object item : memberIdentifiers) {
                resolveUser(item).ifPresent(members::add);
            }
        }

        ChatGroup group = ChatGroup.builder()
                .name(name)
                .avatar(avatar == null || avatar.trim().isEmpty() ? "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=100" : avatar)
                .createdBy(creator)
                .members(members)
                .admins(new HashSet<>(List.of(creator)))
                .build();

        return chatGroupRepository.save(group);
    }

    public List<ChatGroup> getGroupsForUser(String username) {
        User user = userRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
        return chatGroupRepository.findByMembersContaining(user);
    }

    public ChatGroup getGroupById(Long id) {
        return chatGroupRepository.findById(id).orElse(null);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getGroupDetails(Long id, String currentUsername) {
        ChatGroup group = chatGroupRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with ID: " + id));

        boolean isAdmin = group.getAdmins().stream().anyMatch(a -> a.getUsername().equalsIgnoreCase(currentUsername));
        if (group.getAdmins().isEmpty() && group.getCreatedBy() != null && group.getCreatedBy().getUsername().equalsIgnoreCase(currentUsername)) {
            isAdmin = true;
        }

        List<Map<String, Object>> memberList = group.getMembers().stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("username", m.getUsername());
            map.put("phoneNumber", m.getPhoneNumber());
            map.put("profilePicUrl", m.getProfilePicUrl());
            map.put("about", m.getAbout());
            boolean isThisAdmin = group.getAdmins().stream().anyMatch(a -> a.getId().equals(m.getId()));
            if (group.getAdmins().isEmpty() && group.getCreatedBy() != null && group.getCreatedBy().getId().equals(m.getId())) {
                isThisAdmin = true;
            }
            map.put("isAdmin", isThisAdmin);
            map.put("isYou", m.getUsername().equalsIgnoreCase(currentUsername));
            return map;
        }).sorted((a, b) -> {
            boolean aAdmin = (boolean) a.get("isAdmin");
            boolean bAdmin = (boolean) b.get("isAdmin");
            if (aAdmin != bAdmin) return aAdmin ? -1 : 1;
            return ((String) a.get("username")).compareToIgnoreCase((String) b.get("username"));
        }).collect(Collectors.toList());

        Map<String, Object> res = new HashMap<>();
        res.put("id", group.getId());
        res.put("name", group.getName());
        res.put("avatar", group.getAvatar());
        res.put("createdAt", group.getCreatedAt() != null ? group.getCreatedAt().toString() : null);
        res.put("createdById", group.getCreatedBy() != null ? group.getCreatedBy().getId() : null);
        res.put("createdByUsername", group.getCreatedBy() != null ? group.getCreatedBy().getUsername() : null);
        res.put("isAdmin", isAdmin);
        res.put("members", memberList);
        res.put("memberCount", memberList.size());
        res.put("onlyAdminsCanMessage", group.isOnlyAdminsCanMessage());
        res.put("onlyAdminsCanCall", group.isOnlyAdminsCanCall());
        res.put("onlyAdminsCanAddMembers", group.isOnlyAdminsCanAddMembers());
        return res;
    }

    @Transactional
    public Map<String, Object> updateGroupSettings(Long groupId, Map<String, Object> settings, String requesterUsername) {
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with ID: " + groupId));

        boolean isAdmin = group.getAdmins().stream().anyMatch(a -> a.getUsername().equalsIgnoreCase(requesterUsername));
        if (group.getAdmins().isEmpty() && group.getCreatedBy() != null && group.getCreatedBy().getUsername().equalsIgnoreCase(requesterUsername)) {
            isAdmin = true;
        }

        if (!isAdmin) {
            throw new IllegalStateException("Only group admins can change group settings");
        }

        if (settings.containsKey("onlyAdminsCanMessage")) {
            group.setOnlyAdminsCanMessage((Boolean) settings.get("onlyAdminsCanMessage"));
        }
        if (settings.containsKey("onlyAdminsCanCall")) {
            group.setOnlyAdminsCanCall((Boolean) settings.get("onlyAdminsCanCall"));
        }
        if (settings.containsKey("onlyAdminsCanAddMembers")) {
            group.setOnlyAdminsCanAddMembers((Boolean) settings.get("onlyAdminsCanAddMembers"));
        }

        chatGroupRepository.save(group);
        return getGroupDetails(groupId, requesterUsername);
    }

    @Transactional
    public Map<String, Object> addMembers(Long groupId, List<?> newMemberIdentifiers, String requesterUsername) {
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with ID: " + groupId));

        boolean isMember = group.getMembers().stream().anyMatch(m -> m.getUsername().equalsIgnoreCase(requesterUsername));
        if (!isMember) {
            throw new IllegalStateException("You must be a member of the group to add participants");
        }

        boolean isAdmin = group.getAdmins().stream().anyMatch(a -> a.getUsername().equalsIgnoreCase(requesterUsername));
        if (group.getAdmins().isEmpty() && group.getCreatedBy() != null && group.getCreatedBy().getUsername().equalsIgnoreCase(requesterUsername)) {
            isAdmin = true;
        }

        if (group.isOnlyAdminsCanAddMembers() && !isAdmin) {
            throw new IllegalStateException("Only group admins can add members to this group");
        }

        if (newMemberIdentifiers != null) {
            for (Object item : newMemberIdentifiers) {
                resolveUser(item).ifPresent(group.getMembers()::add);
            }
        }

        chatGroupRepository.save(group);
        return getGroupDetails(groupId, requesterUsername);
    }

    @Transactional
    public Map<String, Object> removeMember(Long groupId, Object targetIdentifier, String requesterUsername) {
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with ID: " + groupId));

        User targetUser = resolveUser(targetIdentifier)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + targetIdentifier));

        boolean isRequesterAdmin = group.getAdmins().stream().anyMatch(a -> a.getUsername().equalsIgnoreCase(requesterUsername));
        if (group.getAdmins().isEmpty() && group.getCreatedBy() != null && group.getCreatedBy().getUsername().equalsIgnoreCase(requesterUsername)) {
            isRequesterAdmin = true;
        }
        boolean isSelf = targetUser.getUsername().equalsIgnoreCase(requesterUsername);

        if (!isRequesterAdmin && !isSelf) {
            throw new IllegalStateException("Only group admins can remove other members");
        }

        group.getMembers().removeIf(m -> m.getId().equals(targetUser.getId()) || m.getUsername().equalsIgnoreCase(targetUser.getUsername()));
        group.getAdmins().removeIf(m -> m.getId().equals(targetUser.getId()) || m.getUsername().equalsIgnoreCase(targetUser.getUsername()));
        chatGroupRepository.save(group);
        return getGroupDetails(groupId, requesterUsername);
    }

    @Transactional
    public void leaveGroup(Long groupId, String requesterUsername) {
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with ID: " + groupId));

        group.getMembers().removeIf(m -> m.getUsername().equalsIgnoreCase(requesterUsername));
        group.getAdmins().removeIf(m -> m.getUsername().equalsIgnoreCase(requesterUsername));

        if (group.getAdmins().isEmpty() && !group.getMembers().isEmpty()) {
            User nextAdmin = group.getMembers().iterator().next();
            group.getAdmins().add(nextAdmin);
            group.setCreatedBy(nextAdmin); // also update createdBy just in case
        }

        chatGroupRepository.save(group);
    }

    @Transactional
    public Map<String, Object> promoteToAdmin(Long groupId, Object targetIdentifier, String requesterUsername) {
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with ID: " + groupId));

        boolean isRequesterAdmin = group.getAdmins().stream().anyMatch(a -> a.getUsername().equalsIgnoreCase(requesterUsername));
        if (group.getAdmins().isEmpty() && group.getCreatedBy() != null && group.getCreatedBy().getUsername().equalsIgnoreCase(requesterUsername)) {
            isRequesterAdmin = true;
        }

        if (!isRequesterAdmin) {
            throw new IllegalStateException("Only group admins can promote other members");
        }

        User targetUser = resolveUser(targetIdentifier)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + targetIdentifier));

        boolean isMember = group.getMembers().stream().anyMatch(m -> m.getId().equals(targetUser.getId()));
        if (!isMember) {
            throw new IllegalStateException("Target user is not a member of this group");
        }

        group.getAdmins().add(targetUser);
        chatGroupRepository.save(group);
        return getGroupDetails(groupId, requesterUsername);
    }

    @Transactional
    public Map<String, Object> demoteFromAdmin(Long groupId, Object targetIdentifier, String requesterUsername) {
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with ID: " + groupId));

        boolean isRequesterAdmin = group.getAdmins().stream().anyMatch(a -> a.getUsername().equalsIgnoreCase(requesterUsername));
        if (group.getAdmins().isEmpty() && group.getCreatedBy() != null && group.getCreatedBy().getUsername().equalsIgnoreCase(requesterUsername)) {
            isRequesterAdmin = true;
        }

        if (!isRequesterAdmin) {
            throw new IllegalStateException("Only group admins can demote other admins");
        }

        User targetUser = resolveUser(targetIdentifier)
                .orElseThrow(() -> new IllegalArgumentException("Target user not found: " + targetIdentifier));

        if (group.getAdmins().size() <= 1 && group.getAdmins().stream().anyMatch(a -> a.getId().equals(targetUser.getId()))) {
            throw new IllegalStateException("Cannot demote the only admin of the group");
        }

        group.getAdmins().removeIf(a -> a.getId().equals(targetUser.getId()));
        chatGroupRepository.save(group);
        return getGroupDetails(groupId, requesterUsername);
    }

    private Optional<User> resolveUser(Object item) {
        if (item == null) return Optional.empty();
        String str = item.toString().trim();
        if (str.isEmpty()) return Optional.empty();

        // 1. Try by numeric ID
        try {
            Long id = Long.parseLong(str);
            Optional<User> u = userRepository.findById(id);
            if (u.isPresent()) return u;
        } catch (NumberFormatException ignored) {}

        // 2. Try by username
        Optional<User> byUser = userRepository.findByUsernameIgnoreCase(str);
        if (byUser.isPresent()) return byUser;

        // 3. Try by phone number
        Optional<User> byPhone = userRepository.findByPhoneNumber(str);
        if (byPhone.isPresent()) return byPhone;

        // 4. Try by email
        return userRepository.findByEmail(str);
    }
}
