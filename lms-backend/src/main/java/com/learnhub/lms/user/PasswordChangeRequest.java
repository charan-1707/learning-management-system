package com.learnhub.lms.user;

import jakarta.validation.constraints.NotBlank;

public record PasswordChangeRequest(@NotBlank(message = "current password is required") String current,
    @NotBlank(message = "new password is required") String next) {
}
