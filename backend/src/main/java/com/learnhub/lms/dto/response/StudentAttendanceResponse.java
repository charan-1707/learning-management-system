package com.learnhub.lms.dto.response;

import java.util.List;

/**
 * Student-owned attendance overview combining an overall summary, a per-course
 * breakdown and a recent history feed.
 */
public record StudentAttendanceResponse(
        int percent,
        long present,
        long total,
        int courses,
        List<CourseAttendanceResponse> byCourse,
        List<AttendanceHistoryResponse> history
) {
}