package com.whatsappclone.config;

import com.whatsappclone.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * In production‑like mode we do not seed any demo users.
 * This initializer only logs that it ran, leaving the database empty.
 */
@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initDemoUser() {
        return args -> {
            System.out.println("[INFO] DataInitializer – no demo users created. Database starts clean.");
        };
    }
}
