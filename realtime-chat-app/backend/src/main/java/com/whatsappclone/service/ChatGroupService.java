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

        boolean isAdmin = group.getCreatedBy() != null && group.getCreatedBy().getUsername().equalsIgnoreCase(currentUsername);

        List<Map<String, Object>> memberList = group.getMembers().stream().map(m -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", m.getId());
            map.put("username", m.getUsername());
            map.put("phoneNumber", m.getPhoneNumber());
            map.put("profilePicUrl", m.getProfilePicUrl());
            map.put("about", m.getAbout());
            boolean isThisAdmin = group.getCreatedBy() != null && group.getCreatedBy().getId().equals(m.getId());
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
        return res;
    }

    @Transactional
    public Map<String, Object> addMembers(Long groupId, List<?> newMemberIdentifiers, String requesterUsername) {
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with ID: " + groupId));

        boolean isMember = group.getMembers().stream().anyMatch(m -> m.getUsername().equalsIgnoreCase(requesterUsername));
        if (!isMember) {
            throw new IllegalStateException("You must be a member of the group to add participants");
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

        boolean isRequesterAdmin = group.getCreatedBy() != null && group.getCreatedBy().getUsername().equalsIgnoreCase(requesterUsername);
        boolean isSelf = targetUser.getUsername().equalsIgnoreCase(requesterUsername);

        if (!isRequesterAdmin && !isSelf) {
            throw new IllegalStateException("Only group admins can remove other members");
        }

        group.getMembers().removeIf(m -> m.getId().equals(targetUser.getId()) || m.getUsername().equalsIgnoreCase(targetUser.getUsername()));
        chatGroupRepository.save(group);
        return getGroupDetails(groupId, requesterUsername);
    }

    @Transactional
    public void leaveGroup(Long groupId, String requesterUsername) {
        ChatGroup group = chatGroupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found with ID: " + groupId));

        group.getMembers().removeIf(m -> m.getUsername().equalsIgnoreCase(requesterUsername));

        if (group.getCreatedBy() != null && group.getCreatedBy().getUsername().equalsIgnoreCase(requesterUsername)) {
            if (!group.getMembers().isEmpty()) {
                group.setCreatedBy(group.getMembers().iterator().next());
            }
        }

        chatGroupRepository.save(group);
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
