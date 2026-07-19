package com.whatsappclone.repo;

import com.whatsappclone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    List<User> findAllByUsername(String username);

    @Query("SELECT u FROM User u WHERE LOWER(u.username) = LOWER(:username)")
    List<User> findAllByUsernameIgnoreCase(@Param("username") String username);

    List<User> findAllByEmail(String email);

    List<User> findAllByPhoneNumber(String phoneNumber);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByPhoneNumber(String phoneNumber);

    default Optional<User> findByUsername(String username) {
        return findAllByUsername(username).stream().findFirst();
    }

    default Optional<User> findByUsernameIgnoreCase(String username) {
        return findAllByUsernameIgnoreCase(username).stream().findFirst();
    }

    default Optional<User> findByEmail(String email) {
        return findAllByEmail(email).stream().findFirst();
    }

    default Optional<User> findByPhoneNumber(String phoneNumber) {
        return findAllByPhoneNumber(phoneNumber).stream().findFirst();
    }
}
