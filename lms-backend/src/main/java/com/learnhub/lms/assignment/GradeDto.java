package com.learnhub.lms.assignment;

import java.time.LocalDateTime;

public record GradeDto(Long id, String courseId, String courseName, String assessment,
    String type, Integer score, Integer maxScore, Double pct, LocalDateTime gradedAt) {

  public static GradeDto from(Grade g) {
    String courseId = g.getCourse() == null ? null : g.getCourse().getId();
    String courseName = g.getCourse() == null ? null : g.getCourse().getName();
    Double pct = null;
    if (g.getScore() != null && g.getMaxScore() != null && g.getMaxScore() > 0) {
      pct = g.getScore() * 100.0 / g.getMaxScore();
    }
    String type = g.getType() == null ? null : g.getType().name();
    return new GradeDto(g.getId(), courseId, courseName, g.getAssessment(), type,
        g.getScore(), g.getMaxScore(), pct, g.getGradedAt());
  }
}
