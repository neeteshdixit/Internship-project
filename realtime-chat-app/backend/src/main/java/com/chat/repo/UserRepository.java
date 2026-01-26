package com.chat.repo;

import com.chat.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    List<User> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName);

    List<User> findByStatus(String status);

    @Query("SELECT u FROM User u WHERE u.online = true")
    List<User> findOnlineUsers();

    @Query("SELECT u FROM User u WHERE u.enabled = true")
    List<User> findActiveUsers();
}
