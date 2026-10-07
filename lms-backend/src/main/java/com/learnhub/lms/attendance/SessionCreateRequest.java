package com.learnhub.lms.attendance;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

/** POST /api/courses/:id/attendance/sessions body — upserted per date. */
public record SessionCreateRequest(
    @NotNull(message = "date is required") LocalDate date,
    @NotNull(message = "records is required") List<@Valid AttendanceRecordInput> records) {
}
