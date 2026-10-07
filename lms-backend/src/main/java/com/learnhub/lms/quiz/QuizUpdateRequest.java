package com.learnhub.lms.quiz;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/** PATCH /api/quizzes/:id body — every field optional (owner/ADMIN). */
public record QuizUpdateRequest(
    @Size(min = 1, max = 250) String title,
    @Min(value = 1, message = "durationMin must be positive") Integer durationMin,
    @Min(value = 1, message = "attemptsMax must be positive") Integer attemptsMax,
    LocalDateTime dueAt,
    @Size(max = 30) String status) {
}
