package com.learnhub.lms.assignment;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * GET /api/courses/:id/gradebook aggregation (NEW endpoint, no current API —
 * the faculty page reads M.* today). Keys are strings for stable JSON.
 */
public record GradebookDto(List<GradebookStudent> students, List<GradebookAssignment> assignments,
    Map<String, Map<String, GradeCell>> cells) {

  public record GradebookStudent(Long id, String name, String email) {
  }

  public record GradebookAssignment(String id, String title, Integer maxMarks, LocalDateTime dueAt) {
  }

  public record GradeCell(Integer score, String status) {
  }
}
