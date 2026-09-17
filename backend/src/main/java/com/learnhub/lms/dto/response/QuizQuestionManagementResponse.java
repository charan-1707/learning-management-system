package com.learnhub.lms.dto.response;

import java.math.BigDecimal;

/**
 * Faculty/authoring view of a question, including the correct option.
 */
public record QuizQuestionManagementResponse(
        Long id,
        Long quizId,
        String questionText,
        String optionA,
        String optionB,
        String optionC,
        String optionD,
        String correctOption,
        BigDecimal marks,
        Integer displayOrder
) {
}