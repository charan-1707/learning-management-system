package com.learnhub.lms.assignment;

import java.util.List;

/** GET /api/students/me/grades/summary shape (mirrors API.grades.summary). */
public record GradeSummaryDto(double average, int count, BestGrade best, List<GradeDto> recent) {

  public record BestGrade(String course, double pct) {
  }
}
