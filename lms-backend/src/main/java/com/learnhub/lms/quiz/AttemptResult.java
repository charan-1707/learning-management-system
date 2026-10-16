package com.learnhub.lms.quiz;

/**
 * POST /api/quizzes/:id/attempts result. {@code grade} is the letter grade,
 * {@code bestScore} the {@code "x/total"} display string the frontend keeps,
 * {@code passed} the 40% final-test pass mark (also shown for normal quizzes).
 */
public record AttemptResult(int score, int total, int pct, String grade, String bestScore,
    long attempts, boolean passed) {
}
