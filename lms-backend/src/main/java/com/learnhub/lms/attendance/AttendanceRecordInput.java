package com.learnhub.lms.attendance;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record AttendanceRecordInput(
    @NotNull(message = "studentId is required") Long studentId,
    @NotNull(message = "status is required")
    @Pattern(regexp = "present|absent",
        message = "status must be present or absent") String status) {
}
