package com.learnhub.lms.assignment;

import java.time.LocalDateTime;

public record SubmissionDto(String id, String assignmentId, String courseId, Long studentId,
    String studentName, String content, String fileUrl, Integer score, String feedback,
    LocalDateTime gradedAt, String status, LocalDateTime submittedAt) {

  public static SubmissionDto from(Submission s) {
    String assignmentId = s.getAssignment() == null ? null : s.getAssignment().getId();
    String courseId = s.getCourse() == null ? null : s.getCourse().getId();
    Long studentId = s.getStudent() == null ? null : s.getStudent().getId();
    String studentName = s.getStudent() == null ? null : s.getStudent().getName();
    String status = s.getStatus() == null ? null : s.getStatus().name();
    return new SubmissionDto(s.getId(), assignmentId, courseId, studentId, studentName,
        s.getContent(), s.getFileUrl(), s.getScore(), s.getFeedback(), s.getGradedAt(),
        status, s.getSubmittedAt());
  }
}
