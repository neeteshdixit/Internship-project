package com.whatsappclone.controller;

import com.whatsappclone.model.User;
import com.whatsappclone.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/search")
    public ResponseEntity<?> searchByPhoneNumber(@RequestParam String phoneNumber) {
        java.util.Optional<User> userOpt = userRepository.findByPhoneNumber(phoneNumber);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return ResponseEntity.ok(new UserDto(
                    user.getId(), 
                    user.getUsername(), 
                    user.getEmail(), 
                    user.getProfilePicUrl() != null ? user.getProfilePicUrl() : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
            ));
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "not available here this user"));
        }
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<UserDto> dtos = users.stream()
                .map(user -> new UserDto(
                        user.getId(), 
                        user.getUsername(), 
                        user.getEmail(), 
                        user.getProfilePicUrl() != null ? user.getProfilePicUrl() : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100"
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    public static record UserDto(Long id, String username, String email, String profilePicUrl) {}
}
