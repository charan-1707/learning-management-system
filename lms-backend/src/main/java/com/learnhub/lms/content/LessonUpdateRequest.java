package com.learnhub.lms.content;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** PATCH /api/lessons/:id body — every field optional. */
public record LessonUpdateRequest(
    @Size(min = 1, max = 250) String title,
    String content,
    @Pattern(regexp = "pdf|video|link", message = "type must be pdf, video or link") String type,
    @Size(max = 250) String meta,
    Long sizeBytes,
    @Size(max = 500) String fileUrl) {
}
