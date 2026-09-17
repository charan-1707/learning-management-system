package com.learnhub.lms.dto.response;

import com.learnhub.lms.enums.AttendanceStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record AttendanceResponse(
        Long id,
        Long courseId,
        String courseTitle,
        Long studentId,
        String studentName,
        LocalDate attendanceDate,
        AttendanceStatus status,
        Long markedBy,
        LocalDateTime createdAt
) {
}