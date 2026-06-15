package com.whatsappclone.controller;

import com.whatsappclone.dto.AuthRequest;
import com.whatsappclone.dto.AuthResponse;
import com.whatsappclone.dto.RegisterRequest;
import com.whatsappclone.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// @RestController: REST endpoints setup. Auto-serializes objects to JSON.
@RestController
// Base mapping: /api/auth se start hone wale requests is controller par aayenge.
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // 1. REGISTER ENDPOINT: POST /api/auth/register
    // @Valid: Yeh command automatic RegisterRequest ke constraints (like @Email, @NotBlank) verify karegi request process hone se pehle.
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest request
    ) {
        // AuthService register function execute karega
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    // 2. LOGIN ENDPOINT: POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody AuthRequest request
    ) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
