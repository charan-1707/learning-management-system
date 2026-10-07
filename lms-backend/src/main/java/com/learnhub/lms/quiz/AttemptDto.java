package com.learnhub.lms.quiz;

import java.time.LocalDateTime;

public record AttemptDto(Long id, String quizId, Long studentId, String studentName,
    Integer score, Integer total, Integer pct,
    LocalDateTime startedAt, LocalDateTime submittedAt) {

  public static AttemptDto from(QuizAttempt a) {
    String quizId = a.getQuiz() == null ? null : a.getQuiz().getId();
    Long studentId = a.getStudent() == null ? null : a.getStudent().getId();
    String studentName = a.getStudent() == null ? null : a.getStudent().getName();
    return new AttemptDto(a.getId(), quizId, studentId, studentName, a.getScore(),
        a.getTotal(), a.getPct(), a.getStartedAt(), a.getSubmittedAt());
  }
}
