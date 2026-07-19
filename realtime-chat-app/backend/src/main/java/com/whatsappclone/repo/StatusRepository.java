package com.whatsappclone.repo;

import com.whatsappclone.model.Status;
import com.whatsappclone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface StatusRepository extends JpaRepository<Status, Long> {
    List<Status> findByUserInAndExpiresAtAfterOrderByCreatedAtAsc(List<User> users, LocalDateTime time);
    List<Status> findByUserAndExpiresAtAfterOrderByCreatedAtAsc(User user, LocalDateTime time);
}
