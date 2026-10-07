package com.learnhub.lms.assignment;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** POST /api/submissions/:id/grade body. Pair validated server-side (§10.7). */
public record GradeRequest(
    @NotBlank(message = "assignmentId is required") String assignmentId,
    @NotNull(message = "score is required")
    @Min(value = 0, message = "score must be 0 or more") Integer score,
    String feedback) {
}
