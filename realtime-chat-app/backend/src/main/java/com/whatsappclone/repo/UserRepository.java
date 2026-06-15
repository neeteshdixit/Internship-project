package com.whatsappclone.repo;

import com.whatsappclone.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

// 1. @Repository: Spring ko batata hai ki yeh database operations (Data Access Object - DAO) handle karega.
@Repository
// 2. JpaRepository<User, Long>: Hum JpaRepository ko extend kar rahe hain.
// - 'User': Humare Entity class ka naam.
// - 'Long': User class ke primary key (@Id) ka data-type.
// JpaRepository hume basic CRUD methods default deta hai (save(), findById(), delete(), findAll(), etc.) bina koi code likhe!
public interface UserRepository extends JpaRepository<User, Long> {

    // 3. Custom Query Method: Spring Data JPA method name ko read karke query khud bana leta hai (Query Creation from Method Names).
    // iska matlab hai: SELECT * FROM users WHERE username = ?
    Optional<User> findByUsername(String username);

    // Optional<User> use kiya hai taaki agar user nahi mila toh null return hone ke bajay 'Optional.empty()' mile, jisse NullPointerException na aaye.
    Optional<User> findByEmail(String email);

    // existsByUsername means: SELECT COUNT(*) > 0 FROM users WHERE username = ?
    // Check karne ke liye ki username register karte waqt available hai ya duplicate.
    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
