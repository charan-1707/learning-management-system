package com.learnhub.lms.assignment;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/**
 * POST /api/courses/:id/assignments body. Accepts {@code maxMarks} or the
 * frontend's {@code maxScore} alias; due stays server-clock compared.
 */
public record AssignmentCreateRequest(
    @NotBlank(message = "title is required") @Size(max = 250) String title,
    @Min(value = 1, message = "maxMarks must be positive") Integer maxMarks,
    @Min(value = 1, message = "maxScore must be positive") Integer maxScore,
    LocalDateTime due,
    String description,
    List<AssignmentAttachment> attachments) {

  public int resolvedMax() {
    if (maxMarks != null) {
      return maxMarks;
    }
    if (maxScore != null) {
      return maxScore;
    }
    return 20;
  }
}
