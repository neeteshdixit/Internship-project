package com.chat.service;

import com.chat.model.Group;
import com.chat.model.User;
import com.chat.repo.GroupRepository;
import com.chat.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

    public Group createGroup(Long creatorId, String groupName, String description) {
        User creator = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("Creator not found"));

        Group group = Group.builder()
                .name(groupName)
                .description(description)
                .createdBy(creator)
                .status("ACTIVE")
                .build();

        group.getMembers().add(creator);
        log.info("Group created: {} by user: {}", groupName, creator.getUsername());
        return groupRepository.save(group);
    }

    public Group getGroupById(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group not found with id: " + id));
    }

    public List<Group> getUserGroups(Long userId) {
        return groupRepository.findGroupsByMemberId(userId);
    }

    public List<Group> getGroupsCreatedByUser(Long userId) {
        return groupRepository.findGroupsCreatedByUser(userId);
    }

    public List<Group> searchGroups(String keyword) {
        return groupRepository.findByNameContainingIgnoreCase(keyword);
    }

    public void addMemberToGroup(Long groupId, Long userId) {
        Group group = getGroupById(groupId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (group.getMaxMembers() != null && group.getMembers().size() >= group.getMaxMembers()) {
            throw new RuntimeException("Group is full");
        }

        group.getMembers().add(user);
        groupRepository.save(group);
        log.info("User {} added to group: {}", user.getUsername(), group.getName());
    }

    public void removeMemberFromGroup(Long groupId, Long userId) {
        Group group = getGroupById(groupId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        group.getMembers().remove(user);
        groupRepository.save(group);
        log.info("User {} removed from group: {}", user.getUsername(), group.getName());
    }

    public Group updateGroup(Long id, String name, String description) {
        Group group = getGroupById(id);
        group.setName(name);
        group.setDescription(description);
        group.setUpdatedAt(LocalDateTime.now());
        log.info("Group updated: {}", group.getName());
        return groupRepository.save(group);
    }

    public void deleteGroup(Long id) {
        groupRepository.deleteById(id);
        log.info("Group deleted with id: {}", id);
    }

    public void archiveGroup(Long id) {
        Group group = getGroupById(id);
        group.setStatus("ARCHIVED");
        groupRepository.save(group);
        log.info("Group archived: {}", group.getName());
    }

    public List<Group> getAllActiveGroups() {
        return groupRepository.findByStatus("ACTIVE");
    }

    public Boolean isMemberOfGroup(Long userId, Long groupId) {
        Group group = getGroupById(groupId);
        return group.getMembers().stream()
                .anyMatch(u -> u.getId().equals(userId));
    }
}
