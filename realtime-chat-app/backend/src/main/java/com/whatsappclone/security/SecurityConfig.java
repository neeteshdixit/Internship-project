package com.whatsappclone.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

// @Configuration: Spring Boot ko batata hai ki yeh file Spring Bean definitions contain karti hai (Configuration class).
@Configuration
// @EnableWebSecurity: Custom Spring Security filter rules enable karne ke liye.
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final AuthenticationProvider authenticationProvider;

    // 1. SECURITY FILTER CHAIN:
    // Application ke authorization policies ko control aur filter rules define karne ke liye key config path.
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1.1. CSRF (Cross-Site Request Forgery) ko disable karenge, kyunki JWT design stateless hai.
            .csrf(AbstractHttpConfigurer::disable)
            // 1.2. API request routes settings:
            .authorizeHttpRequests(auth -> auth
                // Registration aur Login controller paths ko public permit denge (Anonymous access)
                .requestMatchers("/api/auth/**").permitAll()
                // Kisi bhi aur REST API request (like /api/chats) ko security verify karne ke liye user validation token mandatory hai.
                .anyRequest().authenticated()
            )
            // 1.3. Stateless session configure karna: Spring ko direct instructions hain ki database/memory cookies use na kare sessions ke liye.
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // Auth check provider mapping (ApplicationConfig se loaded provider link karenge)
            .authenticationProvider(authenticationProvider)
            // 1.4. Custom JWT Interceptor filter integration:
            // Custom jwtAuthFilter check step, Spring Security ke default authentication block (UsernamePasswordAuthenticationFilter) se just pehle trigger hoga.
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

