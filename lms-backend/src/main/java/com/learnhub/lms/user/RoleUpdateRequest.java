package com.learnhub.lms.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RoleUpdateRequest(
    @NotBlank(message = "role is required")
    @Pattern(regexp = "student|faculty|admin", message = "role must be student, faculty or admin") String role) {
}
