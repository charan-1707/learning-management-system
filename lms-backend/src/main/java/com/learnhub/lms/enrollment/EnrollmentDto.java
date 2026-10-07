package com.learnhub.lms.enrollment;

import java.time.LocalDateTime;

public record EnrollmentDto(Long id, Long studentId, String courseId, String status,
    Integer progressPercent, LocalDateTime enrolledAt) {

  public static EnrollmentDto from(Enrollment e) {
    Long studentId = e.getStudent() == null ? null : e.getStudent().getId();
    String courseId = e.getCourse() == null ? null : e.getCourse().getId();
    String status = e.getStatus() == null ? null : e.getStatus().name();
    return new EnrollmentDto(e.getId(), studentId, courseId, status,
        e.getProgressPercent(), e.getEnrolledAt());
  }
}
