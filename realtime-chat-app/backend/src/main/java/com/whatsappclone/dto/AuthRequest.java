package com.whatsappclone.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Login request — accepts phone number OR username as identifier.
 * No @NotBlank here; null check is handled in AuthService.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    /** Phone number (e.g. 9580390666) OR username */
    private String identifier;
    private String password;

    // Backwards-compatibility alias so Spring / Jackson can also map "username" JSON field
    public String getUsername() { return identifier; }
    public void setUsername(String username) {
        if (this.identifier == null) this.identifier = username;
    }
}
