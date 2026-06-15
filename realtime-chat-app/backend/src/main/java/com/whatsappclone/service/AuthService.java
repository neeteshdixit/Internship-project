package com.whatsappclone.service;

import com.whatsappclone.dto.AuthRequest;
import com.whatsappclone.dto.AuthResponse;
import com.whatsappclone.dto.RegisterRequest;
import com.whatsappclone.model.User;
import com.whatsappclone.repo.UserRepository;
import com.whatsappclone.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// @Service: Spring Service class
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    // 1. REGISTER USER:
    public AuthResponse register(RegisterRequest request) {
        // Validation check for duplicates
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // Hashing password and mapping request DTO to database User Entity.
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                // Hashing the password using BCrypt
                .password(passwordEncoder.encode(request.getPassword()))
                .profilePicUrl(request.getProfilePicUrl())
                .build();

        // Database mein save karenge
        User savedUser = userRepository.save(user);

        // JWT Token generate karenge
        String jwtToken = jwtService.generateToken(savedUser);

        // Success response return karenge client ko
        return AuthResponse.builder()
                .token(jwtToken)
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .profilePicUrl(savedUser.getProfilePicUrl())
                .build();
    }

    // 2. LOGIN USER:
    public AuthResponse login(AuthRequest request) {
        // AuthenticationManager check karega ki username aur password database se match kar rahe hain ya nahi.
        // Agar match nahi karenge toh Spring custom exception throw kar dega aur process wahi ruk jayega.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        // If credentials match: load user details from DB
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        // Generate dynamic token
        String jwtToken = jwtService.generateToken(user);

        // Return token & profile details
        return AuthResponse.builder()
                .token(jwtToken)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .profilePicUrl(user.getProfilePicUrl())
                .build();
    }
}
