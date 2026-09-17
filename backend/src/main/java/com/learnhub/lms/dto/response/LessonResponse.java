package com.learnhub.lms.dto.response;

import com.learnhub.lms.enums.ContentType;

import java.time.LocalDateTime;

/**
 * A lesson. {@code completed} is only populated when a student context is
 * supplied (lesson progress lookup), otherwise it is null.
 */
public record LessonResponse(
        Long id,
        Long moduleId,
        String title,
        String description,
        ContentType contentType,
        String contentUrl,
        Integer duration,
        Integer displayOrder,
        Boolean completed,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}