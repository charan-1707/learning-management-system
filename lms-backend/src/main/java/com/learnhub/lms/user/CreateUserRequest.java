package com.learnhub.lms.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** POST /api/users body (ADMIN): create a student/faculty/admin with a temp password. */
public record CreateUserRequest(
    @NotBlank(message = "name is required") @Size(max = 120) String name,
    @NotBlank(message = "email is required") @Email(message = "email must be valid") String email,
    @NotBlank(message = "password is required") @Size(min = 4, message = "password must be at least 4 characters") String password,
    @NotBlank(message = "role is required") String role) {
}
