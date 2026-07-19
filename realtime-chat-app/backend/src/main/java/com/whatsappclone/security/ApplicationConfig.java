package com.whatsappclone.security;

import com.whatsappclone.model.User;
import com.whatsappclone.repo.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
@RequiredArgsConstructor
public class ApplicationConfig {

    private final UserRepository userRepository;

    /**
     * Resolve login identifier (phone number OR username) to a User.
     * Uses list-based case-insensitive lookup to avoid NonUniqueResultException
     * when duplicate usernames exist in the DB.
     */
    @Bean
    public UserDetailsService userDetailsService() {
        return identifier -> {
            // 1. Phone number (all digits) → lookup by phone
            if (identifier != null && identifier.matches("\\d+")) {
                var byPhone = userRepository.findByPhoneNumber(identifier);
                if (byPhone.isPresent()) return byPhone.get();
            }

            // 2. Exact-case username match
            var byExact = userRepository.findByUsername(identifier);
            if (byExact.isPresent()) return byExact.get();

            // 3. Case-insensitive fallback using list (safe — no NonUniqueResultException)
            List<User> matches = userRepository.findAllByUsernameIgnoreCase(identifier);
            if (!matches.isEmpty()) return matches.get(0);

            throw new UsernameNotFoundException("No user found for: " + identifier);
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
