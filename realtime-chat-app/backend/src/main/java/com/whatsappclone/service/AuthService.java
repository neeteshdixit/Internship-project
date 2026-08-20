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

import com.whatsappclone.exception.UserAlreadyExistsException;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final com.whatsappclone.repo.PrivacySettingsRepository privacySettingsRepository;

    // 1. REGISTER USER:
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException("Username is already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException("Email is already registered");
        }
        // Note: Phone number unique nahi hai — ek number se multiple accounts allowed hain

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .password(passwordEncoder.encode(request.getPassword()))
                .profilePicUrl(request.getProfilePicUrl())
                .build();

        User savedUser = userRepository.save(user);

        com.whatsappclone.model.PrivacySettings settings = com.whatsappclone.model.PrivacySettings.builder()
                .user(savedUser)
                .build();
        privacySettingsRepository.save(settings);

        String jwtToken = jwtService.generateToken(savedUser);

        return buildResponse(jwtToken, savedUser);
    }

    // 2. LOGIN USER — supports phone number OR username:
    public AuthResponse login(AuthRequest request) {
        String identifier = request.getIdentifier();
        if (identifier == null || identifier.isBlank()) {
            throw new IllegalArgumentException("Phone number or username is required");
        }
        String password = request.getPassword();
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password is required");
        }

        // Resolve actual username to pass to AuthenticationManager
        // (Spring Security needs the "username" field used in UserDetailsService)
        // We pass the raw identifier — ApplicationConfig.userDetailsService() handles resolution.
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
        );

        // Look up the resolved user (same logic as UserDetailsService)
        User user = resolveUser(identifier);

        String jwtToken = jwtService.generateToken(user);
        return buildResponse(jwtToken, user);
    }

    /**
     * Resolve phone OR username to a User entity.
     */
    private User resolveUser(String identifier) {
        // Phone number (all digits)?
        if (identifier != null && identifier.matches("\\d+")) {
            var byPhone = userRepository.findByPhoneNumber(identifier);
            if (byPhone.isPresent()) return byPhone.get();
        }
        // Exact username
        var byUsername = userRepository.findByUsername(identifier);
        if (byUsername.isPresent()) return byUsername.get();

        // Case-insensitive list fallback (safe)
        var matches = userRepository.findAllByUsernameIgnoreCase(identifier);
        if (!matches.isEmpty()) return matches.get(0);

        throw new IllegalArgumentException("Invalid credentials");
    }

    private AuthResponse buildResponse(String token, User user) {
        return AuthResponse.builder()
                .token(token)
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .profilePicUrl(user.getProfilePicUrl())
                .build();
    }
}
