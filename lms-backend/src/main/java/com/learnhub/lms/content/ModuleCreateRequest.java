package com.learnhub.lms.content;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ModuleCreateRequest(
    @NotBlank(message = "title is required") @Size(max = 200) String title) {
}
