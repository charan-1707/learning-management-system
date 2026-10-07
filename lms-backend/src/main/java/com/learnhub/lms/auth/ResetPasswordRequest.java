package com.learnhub.lms.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** POST /api/auth/reset-password body. */
public record ResetPasswordRequest(
    @NotBlank(message = "token is required") String token,
    @NotBlank(message = "password is required") @Size(min = 4, message = "password must be at least 4 characters") String newPassword) {
}
