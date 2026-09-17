package com.learnhub.lms.dto.response;

import java.time.LocalDateTime;

public record AnnouncementResponse(
        Long id,
        Long courseId,
        String courseTitle,
        Long facultyId,
        String facultyName,
        String title,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}