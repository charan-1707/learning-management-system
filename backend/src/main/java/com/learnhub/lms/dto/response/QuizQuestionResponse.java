package com.learnhub.lms.dto.response;

import java.math.BigDecimal;

/**
 * Student-facing question view: the correct option is never exposed.
 */
public record QuizQuestionResponse(
        Long id,
        Long quizId,
        String questionText,
        String optionA,
        String optionB,
        String optionC,
        String optionD,
        BigDecimal marks,
        Integer displayOrder
) {
}