package com.learnhub.lms.course;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CourseStatusRequest(
    @NotBlank(message = "status is required")
    @Pattern(regexp = "published|draft", message = "status must be published or draft") String status) {
}
