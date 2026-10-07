package com.learnhub.lms.assignment;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Assignment shape. Student views carry {@code ownStatus} (graded &gt;
 * submitted &gt; overdue &gt; not-started) plus the own submission snapshot;
 * faculty views leave them null.
 */
public record AssignmentDto(String id, String courseId, String courseName, String title,
    Integer maxMarks, LocalDateTime dueAt, String status, String description,
    List<AssignmentAttachment> attachments,
    String ownStatus, Boolean submitted, Boolean graded, Integer score) {

  private static final ObjectMapper JSON = new ObjectMapper();

  public static AssignmentDto from(Assignment a) {
    String courseId = a.getCourse() == null ? null : a.getCourse().getId();
    String courseName = null;
    if (a.getCourse() != null) {
      courseName = a.getCourse().getShortName() == null
          ? a.getCourse().getName() : a.getCourse().getShortName();
    }
    return new AssignmentDto(a.getId(), courseId, courseName, a.getTitle(),
        a.getMaxMarks(), a.getDueAt(), a.getStatus(), a.getDescription(),
        parseAttachments(a.getAttachmentsJson()),
        null, null, null, null);
  }

  public AssignmentDto withOwn(String ownStatus, boolean submitted, boolean graded, Integer score) {
    return new AssignmentDto(id, courseId, courseName, title, maxMarks, dueAt, status,
        description, attachments, ownStatus, submitted, graded, score);
  }

  static List<AssignmentAttachment> parseAttachments(String raw) {
    if (raw == null || raw.isBlank()) {
      return List.of();
    }
    try {
      List<AssignmentAttachment> parsed =
          JSON.readValue(raw, new TypeReference<List<AssignmentAttachment>>() {
          });
      return parsed == null ? List.of() : parsed;
    } catch (Exception ex) {
      return List.of();
    }
  }
}
