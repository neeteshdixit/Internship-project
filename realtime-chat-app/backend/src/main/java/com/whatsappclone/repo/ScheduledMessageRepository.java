package com.whatsappclone.repo;

import com.whatsappclone.model.ScheduledMessage;
import com.whatsappclone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface ScheduledMessageRepository extends JpaRepository<ScheduledMessage, Long> {
    List<ScheduledMessage> findBySentFalseAndScheduledTimeBefore(LocalDateTime time);
    List<ScheduledMessage> findBySenderOrderByScheduledTimeAsc(User sender);
}
