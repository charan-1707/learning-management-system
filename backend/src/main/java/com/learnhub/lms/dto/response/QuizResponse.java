package com.learnhub.lms.dto.response;

import com.learnhub.lms.enums.QuizStatus;

import java.time.LocalDateTime;

public record QuizResponse(
        Long id,
        Long courseId,
        String courseTitle,
        String title,
        String description,
        Integer durationMinutes,
        Integer maxAttempts,
        QuizStatus status,
        long questionCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}