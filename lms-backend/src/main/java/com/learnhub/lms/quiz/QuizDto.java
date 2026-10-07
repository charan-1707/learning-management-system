package com.learnhub.lms.quiz;

import java.time.LocalDateTime;

/**
 * Quiz shape. {@code taken}/{@code attempts}/{@code bestScore} are derived
 * per requesting student (never a global flag — fixes the frontend's
 * single-user bug, plan risk #4).
 */
public record QuizDto(String id, String courseId, String courseName, String title,
    Integer durationMin, Integer attemptsMax, LocalDateTime dueAt, String status,
    int questionCount, boolean taken, int attempts, String bestScore) {
}
