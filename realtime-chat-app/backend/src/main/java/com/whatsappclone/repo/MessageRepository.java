package com.whatsappclone.repo;

import com.whatsappclone.model.Message;
import com.whatsappclone.model.User;
import com.whatsappclone.model.ChatGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1) " +
           "ORDER BY m.timestamp ASC")
    List<Message> findChatHistory(@Param("user1") User user1, @Param("user2") User user2);

    @Query("SELECT DISTINCT m.receiver FROM Message m WHERE m.sender.username = :username AND m.receiver IS NOT NULL")
    List<User> findReceiversForSender(@Param("username") String username);

    @Query("SELECT DISTINCT m.sender FROM Message m WHERE m.receiver.username = :username")
    List<User> findSendersForReceiver(@Param("username") String username);

    @Query("SELECT m FROM Message m WHERE m.sender = :sender AND m.receiver = :receiver AND m.status != 'read'")
    List<Message> findUnreadMessages(@Param("sender") User sender, @Param("receiver") User receiver);

    List<Message> findByGroupOrderByTimestampAsc(ChatGroup group);

    @Query(value = "SELECT * FROM messages WHERE " +
           "((sender_id = :u1 AND receiver_id = :u2) OR " +
           "(sender_id = :u2 AND receiver_id = :u1)) " +
           "ORDER BY timestamp DESC LIMIT 1", nativeQuery = true)
    Message findLastMessage(@Param("u1") Long u1, @Param("u2") Long u2);

    @Query(value = "SELECT * FROM messages WHERE group_id = :groupId ORDER BY timestamp DESC LIMIT 1", nativeQuery = true)
    Message findLastGroupMessage(@Param("groupId") Long groupId);

    // Ephemeral Self-Destruct Purge Query
    List<Message> findByExpiresAtLessThanEqual(LocalDateTime now);

    @Query("SELECT m FROM Message m WHERE m.sender = :user OR m.receiver = :user")
    List<Message> findMessagesInvolvingUser(@Param("user") User user);

    // Emergency Panic Wipe Queries
    @Modifying
    @Transactional
    @Query("DELETE FROM Message m WHERE (m.sender = :user1 AND m.receiver = :user2) OR (m.sender = :user2 AND m.receiver = :user1)")
    void wipeChatHistory(@Param("user1") User user1, @Param("user2") User user2);

    @Modifying
    @Transactional
    @Query("DELETE FROM Message m WHERE m.sender = :user OR m.receiver = :user")
    void wipeAllUserMessages(@Param("user") User user);
}
