package com.learnhub.lms.dto.response;

import java.time.LocalDateTime;

public record LessonProgressResponse(
        Long id,
        Long studentId,
        Long lessonId,
        boolean completed,
        LocalDateTime completedAt
) {
}