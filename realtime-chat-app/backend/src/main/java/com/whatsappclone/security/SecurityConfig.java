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
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

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
            // 1.1. CORS enable karenge taaki React frontend se incoming requests block na hon
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // 1.2. CSRF (Cross-Site Request Forgery) ko disable karenge, kyunki JWT design stateless hai.
            .csrf(AbstractHttpConfigurer::disable)
            // 1.3. API request routes settings:
            .authorizeHttpRequests(auth -> auth
                // Registration, Login, and WebSocket paths are public (permitted)
                .requestMatchers("/api/auth/**", "/ws/**").permitAll()
                // Kisi bhi aur REST API request (like /api/chats) ko security verify karne ke liye user validation token mandatory hai.
                .anyRequest().authenticated()
            )
            // 1.4. Stateless session configure karna: Spring ko direct instructions hain ki database/memory cookies use na kare sessions ke liye.
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            // Auth check provider mapping (ApplicationConfig se loaded provider link karenge)
            .authenticationProvider(authenticationProvider)
            // 1.5. Custom JWT Interceptor filter integration:
            // Custom jwtAuthFilter check step, Spring Security ke default authentication block (UsernamePasswordAuthenticationFilter) se just pehle trigger hoga.
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // CORS configurations define karna: browser requests origin validation bypass karne ke liye.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5174")); // React standard ports allowed
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

