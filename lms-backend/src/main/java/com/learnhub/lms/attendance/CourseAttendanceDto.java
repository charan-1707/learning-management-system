package com.learnhub.lms.attendance;

import java.time.LocalDate;

/** Per-course aggregate computed from records (replaces the M.attendance seed). */
public record CourseAttendanceDto(String courseId, String course, int present, int total, int pct) {
}
