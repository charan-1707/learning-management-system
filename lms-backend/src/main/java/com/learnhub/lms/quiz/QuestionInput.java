package com.learnhub.lms.quiz;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/** One question in PUT /api/quizzes/:id/questions (replace-all). */
public record QuestionInput(
    @NotBlank(message = "q is required") String q,
    @NotNull(message = "options are required") @Size(min = 4, max = 4,
        message = "options must contain exactly 4 entries") List<@NotBlank String> options,
    @NotNull(message = "answer is required")
    @Min(value = 0, message = "answer must be 0-3") @Max(value = 3,
        message = "answer must be 0-3") Integer answer) {
}
