package com.whatsappclone.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// DTO (Data Transfer Object): Yeh class sirf client se aane wale registration data ko safely hold karti hai.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    // @NotBlank: Validates if the string is not empty or just spaces.
    @NotBlank(message = "Username cannot be empty")
    @Size(min = 3, max = 20, message = "Username must be between 3 and 20 characters")
    private String username;

    @NotBlank(message = "Email cannot be empty")
    // @Email: Automatically validates if email format matches standard patterns.
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Password cannot be empty")
    @Size(min = 6, message = "Password must be at least 6 characters long")
    private String password;

    private String profilePicUrl;
}
