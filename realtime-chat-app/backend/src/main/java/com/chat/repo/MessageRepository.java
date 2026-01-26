package com.chat.repo;

import com.chat.model.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE (m.sender.id = :userId1 AND m.receiver.id = :userId2) " +
           "OR (m.sender.id = :userId2 AND m.receiver.id = :userId1) ORDER BY m.sentAt ASC")
    List<Message> findPrivateConversation(Long userId1, Long userId2);

    @Query("SELECT m FROM Message m WHERE (m.sender.id = :userId1 AND m.receiver.id = :userId2) " +
           "OR (m.sender.id = :userId2 AND m.receiver.id = :userId1) ORDER BY m.sentAt ASC")
    Page<Message> findPrivateConversation(Long userId1, Long userId2, Pageable pageable);

    List<Message> findByGroupId(Long groupId);

    Page<Message> findByGroupId(Long groupId, Pageable pageable);

    List<Message> findBySenderIdOrderBySentAtDesc(Long senderId);

    @Query("SELECT m FROM Message m WHERE m.sentAt BETWEEN :startDate AND :endDate ORDER BY m.sentAt DESC")
    List<Message> findMessagesByDateRange(LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT m FROM Message m WHERE m.content LIKE %:keyword% ORDER BY m.sentAt DESC")
    List<Message> searchMessages(String keyword);

    @Query("SELECT m FROM Message m WHERE m.status = 'UNREAD' AND m.receiver.id = :userId")
    List<Message> findUnreadMessages(Long userId);
}
