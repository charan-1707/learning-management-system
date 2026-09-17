package com.learnhub.lms.dto.response;

import com.learnhub.lms.enums.QuizAttemptStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record QuizAttemptResponse(
        Long id,
        Long quizId,
        String quizTitle,
        Long studentId,
        String studentName,
        LocalDateTime startedAt,
        LocalDateTime submittedAt,
        BigDecimal score,
        QuizAttemptStatus status
) {
}