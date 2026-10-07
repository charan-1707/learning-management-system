package com.learnhub.lms.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** POST /api/auth/register body. Public signup always creates a student. */
public record RegisterRequest(
    @NotBlank(message = "name is required") @Size(max = 120) String name,
    @NotBlank(message = "email is required") @Email(message = "email must be valid") String email,
    @NotBlank(message = "password is required") @Size(min = 4, message = "password must be at least 4 characters") String password) {
}
