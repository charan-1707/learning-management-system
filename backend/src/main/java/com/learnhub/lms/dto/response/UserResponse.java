package com.learnhub.lms.dto.response;

import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.enums.UserStatus;

import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String name,
        String email,
        UserRole role,
        UserStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}