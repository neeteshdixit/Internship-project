package com.whatsappclone.model;

// JPA annotations import kiye hain (jakarta.persistence se)
import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;

// 1. @Entity: Hibernate ko batata hai ki yeh ek Database Table ke sath map hoga.
@Entity
// 2. @Table: Database mein table ka custom name 'users' rakhne ke liye.
@Table(name = "users")
// 3. Lombok Annotations: Boilerplate code (getter, setter, constructor, etc.) hatane ke liye.
@Data                    // Getter, Setter, toString, equals, hashCode automactic generate karta hai
@Builder                 // Design Pattern dynamic object creation ke liye: User.builder().username("test").build()
@NoArgsConstructor      // Default constructor (JPA iske bina DB se data fetch nahi kar paega)
@AllArgsConstructor     // All fields constructor (Builder pattern ke liye mandatory hai)
public class User implements UserDetails {

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

    // ==========================================
    // SPRING SECURITY USERDETAILS CONTRACT METHODS
    // ==========================================

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Hum simple default role "ROLE_USER" provide kar rahe hain sabhi registered users ko.
        return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
    }

    @Override
    public String getPassword() {
        return password; // DB se fetched hashed password return karega
    }

    @Override
    public String getUsername() {
        return username; // Authentication ID (username) return karega
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // Account expire nahi hua hai
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // Account locked nahi hai
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // Password/Credentials expire nahi hue hain
    }

    @Override
    public boolean isEnabled() {
        return true; // Account disabled nahi hai (Active hai)
    }
}
