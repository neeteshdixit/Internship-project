package com.whatsappclone.model;

// JPA annotations import kiye hain (jakarta.persistence se)
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

// 1. @Entity: Hibernate ko batata hai ki yeh ek Database Table ke sath map hoga.
@Entity
// 2. @Table: Database mein table ka custom name 'users' rakhne ke liye.
@Table(name = "users")
// 3. Lombok Annotations: Boilerplate code (getter, setter, constructor, etc.) hatane ke liye.
@Data                    // Getter, Setter, toString, equals, hashCode automactic generate karta hai
@Builder                 // Design Pattern dynamic object creation ke liye: User.builder().username("test").build()
@NoArgsConstructor      // Default constructor (JPA iske bina DB se data fetch nahi kar paega)
@AllArgsConstructor     // All fields constructor (Builder pattern ke liye mandatory hai)
public class User {

    // 4. @Id: Is field ko Table ka Primary Key banane ke liye.
    @Id
    // 5. @GeneratedValue: ID automation generate karne ke liye. IDENTITY ka matlab PostgreSQL serial generate karega.
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 6. @Column: Table columns par constraints lagane ke liye.
    // unique=true means: Dusra user same username se register nahi ho sakta.
    // nullable=false means: Yeh column database mein null/empty nahi ho sakta (NOT NULL constraint).
    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String profilePicUrl;

    private LocalDateTime lastSeen;

    private LocalDateTime createdAt;

    // 7. @PrePersist: Database mein record save (insert) hone se just pehle yeh function automatically run hoga.
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        lastSeen = LocalDateTime.now();
    }
}
