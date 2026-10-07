package com.learnhub.lms.admin;

import java.util.List;

/** GET /api/admin/reports — aggregated live (plan §12). */
public record ReportsDto(List<EnrollmentByCourse> enrollmentByCourse,
    List<MonthlyActive> monthlyActive, PassRate passRate,
    List<ProgramDistribution> distributionByProgram) {

  public record EnrollmentByCourse(String course, String code, long students) {
  }

  public record MonthlyActive(String month, long active) {
  }

  public record PassRate(long passed, long failed, double average) {
  }

  public record ProgramDistribution(String program, long students) {
  }
}
