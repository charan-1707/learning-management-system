package com.learnhub.lms.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/**
 * PATCH /api/users/me body. All fields optional (null = absent); mirrors the
 * profile page which patches name+email plus extras.
 */
public record UpdateProfileRequest(
    @Size(min = 1, max = 120, message = "name must not be blank") String name,
    @Email(message = "email must be a valid email address") String email,
    @Size(max = 40) String phone,
    @Size(max = 120) String location,
    @Size(max = 120) String program,
    @Size(max = 20) String yearLabel,
    @Size(max = 120) String dept,
    @Size(max = 120) String title) {
}
