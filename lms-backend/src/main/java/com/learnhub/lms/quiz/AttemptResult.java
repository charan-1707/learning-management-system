package com.learnhub.lms.quiz;

/**
 * POST /api/quizzes/:id/attempts result. {@code grade} is the letter grade,
 * {@code bestScore} the {@code "x/total"} display string the frontend keeps.
 */
public record AttemptResult(int score, int total, int pct, String grade, String bestScore,
    long attempts) {
}
