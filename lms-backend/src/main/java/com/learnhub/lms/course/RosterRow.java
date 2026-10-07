package com.learnhub.lms.course;

/** GET /api/courses/:id/roster row (owner/ADMIN). */
public record RosterRow(Long studentId, String name, String email, Integer progressPercent,
    String status) {
}
