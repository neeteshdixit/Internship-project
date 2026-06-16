package com.whatsappclone.repo;

import com.whatsappclone.model.Message;
import com.whatsappclone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender = :user1 AND m.receiver = :user2) OR " +
           "(m.sender = :user2 AND m.receiver = :user1) " +
           "ORDER BY m.timestamp ASC")
    List<Message> findChatHistory(@Param("user1") User user1, @Param("user2") User user2);

    @Query("SELECT DISTINCT CASE WHEN m.sender.username = :username THEN m.receiver ELSE m.sender END " +
           "FROM Message m WHERE m.sender.username = :username OR m.receiver.username = :username")
    List<User> findChatPartners(@Param("username") String username);
}
