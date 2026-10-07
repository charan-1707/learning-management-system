package com.learnhub.lms.communication;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** POST /api/notifications/broadcast body (ADMIN): platform-wide announcement. */
public record NotificationBroadcastRequest(
    @NotBlank(message = "title is required") @Size(max = 250, message = "title must be at most 250 characters") String title,
    @NotBlank(message = "message is required") @Size(max = 2000, message = "message must be at most 2000 characters") String message) {
}
