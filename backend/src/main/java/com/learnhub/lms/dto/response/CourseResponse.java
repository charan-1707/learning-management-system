package com.learnhub.lms.dto.response;

import com.learnhub.lms.enums.CourseStatus;

import java.time.LocalDateTime;

public record CourseResponse(
        Long id,
        String title,
        String code,
        String description,
        String category,
        CourseStatus status,
        Long facultyId,
        String facultyName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}