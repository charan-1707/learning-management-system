package com.learnhub.lms.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Self-service profile update for the authenticated user. All fields are
 * optional; only supplied values are applied. The supplied password is
 * BCrypt-encoded by the service layer.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ProfileUpdateRequest {

    @Size(max = 120)
    private String name;

    @Email
    @Size(max = 255)
    private String email;

    @Size(min = 6, max = 100)
    private String password;
}