package com.learnhub.lms.dto.response;

/**
 * Lightweight response for {@code GET /api/courses/{courseId}/enrollment},
 * lets the frontend know whether the current user is enrolled.
 */
public record EnrollmentCheckResponse(boolean enrolled) {
}