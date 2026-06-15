package com.whatsappclone.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

// @Service: Spring ko batata hai ki yeh ek Service component hai (bussiness logic container).
@Service
public class JwtService {

    // @Value: application.properties se variables read karne ke liye.
    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration}")
    private long jwtExpiration;

    // 1. Token se User Name nikalne ke liye
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Generic function claims (data) extract karne ke liye
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // 2. Naya Token generate karne ke liye jab user login hoga
    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return Jwts
                .builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername()) // Token sub: User's login username
                .setIssuedAt(new Date(System.currentTimeMillis())) // Token kab bana
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpiration)) // Token kab expire hoga (1 Day baad)
                .signWith(getSignInKey(), SignatureAlgorithm.HS256) // HMAC-SHA256 se sign karenge key ko use karke
                .compact(); // Final String representation return karega
    }

    // 3. Token Check karna ki valid hai ya nahi
    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        // User check + check if token is expired
        return (username.equals(userDetails.getUsername())) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Signature verify karke token parse karega aur data claims return karega
    private Claims extractAllClaims(String token) {
        return Jwts
                .parserBuilder()
                .setSigningKey(getSignInKey()) // Sign-in key provide karenge verifying signature ke liye
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // SecretKey text ko decrypt karke HMAC security standard key mein transform karne ke liye
    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
