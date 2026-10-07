package com.learnhub.lms.assignment;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/** PATCH /api/assignments/:id body — every field optional. */
public record AssignmentUpdateRequest(
    @Size(min = 1, max = 250) String title,
    @Min(value = 1, message = "maxMarks must be positive") Integer maxMarks,
    @Min(value = 1, message = "maxScore must be positive") Integer maxScore,
    LocalDateTime due,
    @Size(max = 30) String status,
    String description,
    List<AssignmentAttachment> attachments) {
}
