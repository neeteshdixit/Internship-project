package com.whatsappclone.service;

import com.whatsappclone.model.ChatGroup;
import com.whatsappclone.model.User;
import com.whatsappclone.repo.ChatGroupRepository;
import com.whatsappclone.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChatGroupService {

    private final ChatGroupRepository chatGroupRepository;
    private final UserRepository userRepository;

    public ChatGroup createGroup(String name, String avatar, String creatorUsername, List<String> memberUsernames) {
        User creator = userRepository.findByUsernameIgnoreCase(creatorUsername)
                .orElseThrow(() -> new IllegalArgumentException("Creator not found: " + creatorUsername));

        Set<User> members = new HashSet<>();
        members.add(creator); // Creator is automatically a member

        if (memberUsernames != null) {
            for (String username : memberUsernames) {
                userRepository.findByUsernameIgnoreCase(username).ifPresent(members::add);
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
}
