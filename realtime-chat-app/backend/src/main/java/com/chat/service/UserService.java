package com.chat.service;

import com.chat.model.Role;
import com.chat.model.User;
import com.chat.repo.RoleRepository;
import com.chat.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public User registerUser(User user) {
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setStatus("ACTIVE");
        user.setEnabled(true);

        // Assign default role
        Optional<Role> userRole = roleRepository.findByName("ROLE_USER");
        if (userRole.isPresent()) {
            user.getRoles().add(userRole.get());
        }

        log.info("Registering new user: {}", user.getUsername());
        return userRepository.save(user);
    }

    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public List<User> getAllActiveUsers() {
        return userRepository.findActiveUsers();
    }

    public List<User> getAllOnlineUsers() {
        return userRepository.findOnlineUsers();
    }

    public List<User> searchUsers(String query) {
        return userRepository.findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(query, query);
    }

    public User updateUser(Long id, User userDetails) {
        User user = getUserById(id);
        user.setFirstName(userDetails.getFirstName());
        user.setLastName(userDetails.getLastName());
        user.setPhone(userDetails.getPhone());
        user.setCompany(userDetails.getCompany());
        user.setProfilePicture(userDetails.getProfilePicture());
        user.setUpdatedAt(LocalDateTime.now());

        log.info("Updating user: {}", user.getUsername());
        return userRepository.save(user);
    }

    public User changePassword(Long id, String oldPassword, String newPassword) {
        User user = getUserById(id);

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setUpdatedAt(LocalDateTime.now());

        log.info("Password changed for user: {}", user.getUsername());
        return userRepository.save(user);
    }

    public void setUserOnlineStatus(Long id, Boolean online) {
        User user = getUserById(id);
        user.setOnline(online);
        user.setLastActive(LocalDateTime.now());
        userRepository.save(user);
    }

    public void addRoleToUser(Long userId, String roleName) {
        User user = getUserById(userId);
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
        user.getRoles().add(role);
        userRepository.save(user);
        log.info("Role {} assigned to user: {}", roleName, user.getUsername());
    }

    public void removeRoleFromUser(Long userId, String roleName) {
        User user = getUserById(userId);
        user.getRoles().removeIf(r -> r.getName().equals(roleName));
        userRepository.save(user);
        log.info("Role {} removed from user: {}", roleName, user.getUsername());
    }

    public void deactivateUser(Long id) {
        User user = getUserById(id);
        user.setEnabled(false);
        user.setStatus("INACTIVE");
        user.setOnline(false);
        userRepository.save(user);
        log.info("User deactivated: {}", user.getUsername());
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
        log.info("User deleted with id: {}", id);
    }

    public Page<User> findAll(Pageable pageable) {
        return userRepository.findAll(pageable);
    }
}
