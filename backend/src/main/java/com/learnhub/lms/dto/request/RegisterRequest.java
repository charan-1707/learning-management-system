package com.learnhub.lms.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Self-registration payload. Accounts created through this endpoint are always
 * assigned the STUDENT role regardless of any client-supplied value.
 */
public record RegisterRequest(
        @NotBlank(message = "Name is required.")
        @Size(max = 120)
        String name,

        @NotBlank(message = "Email is required.")
        @Email(message = "A valid email address is required.")
        @Size(max = 255)
        String email,

        @NotBlank(message = "Password is required.")
        @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters.")
        String password
) {
}