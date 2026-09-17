package com.learnhub.lms.dto.response;

import com.learnhub.lms.enums.SubmissionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record SubmissionResponse(
        Long id,
        Long assignmentId,
        String assignmentTitle,
        Long studentId,
        String studentName,
        String fileName,
        String fileUrl,
        LocalDateTime submittedAt,
        SubmissionStatus status,
        BigDecimal score,
        String feedback,
        LocalDateTime gradedAt,
        String gradedByName
) {
}