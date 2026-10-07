package com.learnhub.lms.communication;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AnnouncementCreateRequest(
    @NotBlank(message = "title is required") @Size(max = 250) String title,
    @NotBlank(message = "body is required") String body) {
}
