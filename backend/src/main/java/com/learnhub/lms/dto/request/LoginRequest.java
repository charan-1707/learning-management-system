package com.learnhub.lms.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Credentials used on {@code POST /api/auth/login}.
 */
public record LoginRequest(
        @NotBlank(message = "Email is required.")
        @Email(message = "A valid email address is required.")
        String email,

        @NotBlank(message = "Password is required.")
        String password
) {
}