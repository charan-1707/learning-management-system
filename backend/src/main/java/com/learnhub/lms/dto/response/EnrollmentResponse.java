package com.learnhub.lms.dto.response;

import com.learnhub.lms.enums.EnrollmentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record EnrollmentResponse(
        Long id,
        Long studentId,
        String studentName,
        Long courseId,
        String courseTitle,
        BigDecimal progress,
        EnrollmentStatus status,
        LocalDateTime enrolledAt,
        LocalDateTime completedAt
) {
}