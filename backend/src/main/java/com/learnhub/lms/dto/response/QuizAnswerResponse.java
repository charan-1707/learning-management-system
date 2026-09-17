package com.learnhub.lms.dto.response;

import java.math.BigDecimal;

public record QuizAnswerResponse(
        Long id,
        Long attemptId,
        Long questionId,
        String selectedOption,
        boolean isCorrect,
        BigDecimal marksObtained
) {
}