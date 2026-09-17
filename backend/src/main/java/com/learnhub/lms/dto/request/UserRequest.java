package com.learnhub.lms.dto.request;

import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request used to create/update a user. The supplied password is BCrypt-encoded
 * by the service layer; it is never persisted or serialized in plaintext.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserRequest {

    @NotBlank
    @Size(max = 120)
    private String name;

    @NotBlank
    @Email
    @Size(max = 255)
    private String email;

    @NotBlank
    @Size(min = 6, max = 100)
    private String password;

    @NotNull
    private UserRole role;

    private UserStatus status = UserStatus.ACTIVE;
}