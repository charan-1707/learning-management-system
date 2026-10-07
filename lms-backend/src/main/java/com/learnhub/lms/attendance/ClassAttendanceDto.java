package com.learnhub.lms.attendance;

import java.time.LocalDate;
import java.util.List;

/** GET /api/courses/:id/attendance: roster sheet + class averages (owner/ADMIN). */
public record ClassAttendanceDto(List<SessionSummary> sessions, ClassOverall overall) {

  public record SessionSummary(Long id, LocalDate date, int present, int absent, int total,
      int pct) {
  }

  public record ClassOverall(int sessions, int present, int absent, int total, int percent) {
  }
}
