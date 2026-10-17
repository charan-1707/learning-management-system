package com.learnhub.lms.admin;

import java.util.List;

/** GET /api/admin/reports — aggregated live (plan §12). */
public record ReportsDto(List<EnrollmentByCourse> enrollmentByCourse,
    List<MonthlyActive> monthlyActive, PassRate passRate,
    List<ProgramDistribution> distributionByProgram,
    List<FinalExamStat> finalExams) {

  /** One row per course final test: attempts, average best pct, 40% pass split.
   * {@code quizId} lets the reports UI drill into per-student attempts. */
  public record FinalExamStat(String courseId, String course, String code, String title,
      long attempts, double averagePct, long passed, long failed, String quizId) {
  }

  public record EnrollmentByCourse(String course, String code, long students) {
  }

  public record MonthlyActive(String month, long active) {
  }

  public record PassRate(long passed, long failed, double average) {
  }

  public record ProgramDistribution(String program, long students) {
  }
}
