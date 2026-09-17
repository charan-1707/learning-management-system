package com.learnhub.lms.dto.request;

import com.learnhub.lms.enums.CourseStatus;
import jakarta.validation.constraints.NotNull;

public record CourseStatusUpdateRequest(@NotNull CourseStatus status) {
}