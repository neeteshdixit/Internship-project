package com.chat.repo;

import com.chat.model.Group;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    List<Group> findByNameContainingIgnoreCase(String name);

    @Query("SELECT g FROM Group g WHERE :userId MEMBER OF g.members")
    List<Group> findGroupsByMemberId(Long userId);

    @Query("SELECT g FROM Group g WHERE g.createdBy.id = :userId")
    List<Group> findGroupsCreatedByUser(Long userId);

    List<Group> findByStatus(String status);
}
