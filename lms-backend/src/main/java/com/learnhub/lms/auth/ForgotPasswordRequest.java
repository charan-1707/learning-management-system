package com.learnhub.lms.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** POST /api/auth/forgot-password body. */
public record ForgotPasswordRequest(
    @NotBlank(message = "email is required") @Email(message = "email must be valid") String email) {
}
