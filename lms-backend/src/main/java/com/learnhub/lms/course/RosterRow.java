package com.learnhub.lms.course;

/** GET /api/courses/:id/roster row (owner/ADMIN). attendancePct is null when the student has no attendance records. */
public record RosterRow(Long studentId, String name, String email, Integer progressPercent,
    String status, Integer attendancePct) {
}
