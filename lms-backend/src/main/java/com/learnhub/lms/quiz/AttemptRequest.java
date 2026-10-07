package com.learnhub.lms.quiz;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.List;

/** POST /api/quizzes/:id/attempts body. Answers are positional (index = question position). */
public record AttemptRequest(
    @NotNull(message = "answers is required") List<Integer> answers,
    LocalDateTime startedAt) {
}
