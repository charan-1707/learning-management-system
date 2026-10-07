package com.learnhub.lms.user;

import jakarta.validation.constraints.Pattern;

/**
 * PATCH /api/users/:id/status body. Either {@code status} or
 * {@code toggle:true} (active↔suspended flip, mirrors the admin UI toggle).
 */
public record StatusUpdateRequest(
    @Pattern(regexp = "active|suspended|warning|on-leave",
        message = "status must be active, suspended, warning or on-leave") String status,
    Boolean toggle) {
}
