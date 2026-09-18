package com.learnhub.lms.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * A single scored assessment (graded assignment submission or submitted quiz
 * attempt) aggregated for a student's gradebook.
 *
 * <p>{@code type} is {@code "assignment"} or {@code "quiz"} mirroring the
 * frontend gradebook rows.</p>
 */
public record GradeItemResponse(
        Long assessmentId,
        String assessment,
        Long courseId,
        String course,
        BigDecimal score,
        BigDecimal max,
        String type,
        LocalDateTime date
) {
}