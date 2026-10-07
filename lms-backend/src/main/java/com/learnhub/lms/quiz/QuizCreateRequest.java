package com.learnhub.lms.quiz;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

/** POST /api/quizzes body. Owner becomes the course owner (faculty/admin only). */
public record QuizCreateRequest(
    @NotBlank(message = "courseId is required") String courseId,
    @NotBlank(message = "title is required") @Size(max = 250) String title,
    @Min(value = 1, message = "durationMin must be positive") Integer durationMin,
    @Min(value = 1, message = "attemptsMax must be positive") Integer attemptsMax,
    LocalDateTime dueAt,
    @Size(max = 30) String status) {
}
