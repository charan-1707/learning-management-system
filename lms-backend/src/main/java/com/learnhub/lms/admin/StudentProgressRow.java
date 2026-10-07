package com.learnhub.lms.admin;

/**
 * GET /api/courses/:id/student-progress row (NEW). {@code atRisk} flags
 * low progress or poor attendance for the faculty risk view.
 */
public record StudentProgressRow(Long studentId, String name, int progressPct,
    Double avgScore, Integer attendancePct, boolean atRisk) {
}
