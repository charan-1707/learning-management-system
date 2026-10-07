package com.learnhub.lms.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** POST /api/auth/resend-otp body. */
public record ResendOtpRequest(@NotBlank @Email String email) {
}
