package com.learnhub.lms.dto.response;

import com.learnhub.lms.enums.NotificationType;

import java.time.LocalDateTime;

public record NotificationResponse(
        Long id,
        Long userId,
        String title,
        String message,
        NotificationType type,
        boolean isRead,
        LocalDateTime createdAt
) {
}