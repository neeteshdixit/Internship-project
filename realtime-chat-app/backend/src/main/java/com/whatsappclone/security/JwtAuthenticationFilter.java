package com.whatsappclone.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// @Component: Spring ko batata hai ki yeh ek bean component hai aur iska lifecycle Spring manage karega.
@Component
// Lombok annotation jo class ke declare final fields ke constructor create kar deta hai (Dependency Injection ke liye).
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    // doFilterInternal: Har ek HTTP request par yeh filter exactly ek baar run hoga.
    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        
        // 1. Authorization header check karna
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;

        // Agar authorization header nahi hai ya fir prefix 'Bearer ' se start nahi ho raha toh request aage pass kar do.
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Token nikalenge. 'Bearer ' total 7 characters ka hai.
        jwt = authHeader.substring(7);
        // Token se login username parse/extract karenge
        username = jwtService.extractUsername(jwt);

        // 2. Agar username mil gaya aur user pehle se authenticated (login) nahi hai Spring Context mein
        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            
            // Database se user details load karenge
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            // check standard validity
            if (jwtService.isTokenValid(jwt, userDetails)) {
                
                // Security Authentication token generate karenge authentication set karne ke liye
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                
                // Extra request details link karenge context token se
                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );
                
                // 3. SPRING SECURITY CONTEXT UPDATE:
                // Is step se Spring Security ko pata chal jayega ki user authenticated hai aur access allow karna hai.
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        
        // Filter chain execution complete hone par request aage proceed karne ke liye call karenge
        filterChain.doFilter(request, response);
    }
}
