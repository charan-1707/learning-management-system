package com.learnhub.lms.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Returned after a quiz attempt is submitted: the resulting attempt summary
 * together with per-question correctness.
 */
public record QuizSubmissionResult(
        Long attemptId,
        Long quizId,
        BigDecimal score,
        long totalQuestions,
        long correctAnswers,
        List<QuizAnswerResponse> answers
) {
}