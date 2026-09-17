package com.learnhub.lms.dto.response;

import com.learnhub.lms.enums.AssignmentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AssignmentResponse(
        Long id,
        Long courseId,
        String courseTitle,
        String title,
        String description,
        LocalDateTime dueDate,
        BigDecimal maxMarks,
        AssignmentStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}