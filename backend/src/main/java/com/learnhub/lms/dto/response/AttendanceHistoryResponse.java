package com.learnhub.lms.dto.response;

import com.learnhub.lms.enums.AttendanceStatus;

import java.time.LocalDate;

/**
 * One daily attendance record in a student's history feed.
 */
public record AttendanceHistoryResponse(
        Long courseId,
        String course,
        LocalDate date,
        AttendanceStatus status
) {
}