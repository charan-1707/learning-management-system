package com.learnhub.lms.attendance;

import java.time.LocalDate;

/** Weekly-log row (replaces M.attendanceHistory); week = ISO week label. */
public record AttendanceHistoryRow(LocalDate date, String courseId, String course,
    String status, String week) {
}
