package com.learnhub.lms.dto.response;

import java.time.LocalDateTime;

public record ModuleResponse(
        Long id,
        Long courseId,
        String title,
        String description,
        Integer displayOrder,
        long lessonCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}