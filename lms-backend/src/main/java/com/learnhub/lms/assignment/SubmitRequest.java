package com.learnhub.lms.assignment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** POST /api/assignments/:id/submit body (file upload lands in Phase 7). */
public record SubmitRequest(
    @NotBlank(message = "content is required") String content,
    @Size(max = 500) String fileUrl) {
}
