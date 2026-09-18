package com.learnhub.lms.dto.response;

/**
 * Per-course attendance aggregation for a student.
 */
public record CourseAttendanceResponse(
        Long courseId,
        String course,
        long present,
        long total,
        int percent
) {
}