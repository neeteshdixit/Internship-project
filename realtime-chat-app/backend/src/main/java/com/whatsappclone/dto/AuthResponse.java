package com.whatsappclone.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// AuthResponse: Login ya Registration successful hone par client ko wapas return hone wala object.
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    
    // Auth token (JWT) jo user APIs call karte waqt pass karega header mein.
    private String token;
    
    // User profile metadata so client app profiles load kar sake
    private Long id;
    private String username;
    private String email;
    private String profilePicUrl;
}
