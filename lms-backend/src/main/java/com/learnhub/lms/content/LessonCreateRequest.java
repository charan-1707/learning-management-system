package com.learnhub.lms.content;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LessonCreateRequest(
    @NotBlank(message = "title is required") @Size(max = 250) String title,
    String content,
    @Pattern(regexp = "pdf|video|link", message = "type must be pdf, video or link") String type,
    @Size(max = 250) String meta,
    Long sizeBytes,
    @Size(max = 500) String fileUrl) {
}
