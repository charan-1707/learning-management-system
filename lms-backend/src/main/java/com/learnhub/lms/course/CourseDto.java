package com.learnhub.lms.course;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;

/** List/detail shape. {@code modulesTotal} is computed live; legacy NULL status passes through as null. */
public record CourseDto(String id, String code, String name, String shortName,
    String description, String category, Long instructorId, String instructorName,
    String instructorAvatar, String accent, Integer credits, String semester, String status,
    Integer studentsCount, long modulesTotal, List<String> outcomes, String thumbnailUrl,
    LocalDateTime updatedAt, LocalDateTime createdAt) {

  private static final ObjectMapper JSON = new ObjectMapper();

  public static CourseDto from(Course c, long modulesTotal) {
    Long instructorId = c.getInstructor() == null ? null : c.getInstructor().getId();
    String status = c.getStatus() == null ? null : c.getStatus().name();
    // shortName is optional (course-editor never sets it) — fall back to name
    // so UI labels never render "undefined".
    String shortName = c.getShortName() == null ? c.getName() : c.getShortName();
    String instructorAvatar = c.getInstructor() == null ? null : c.getInstructor().getAvatarUrl();
    return new CourseDto(c.getId(), c.getCode(), c.getName(), shortName,
        c.getDescription(), c.getCategory(), instructorId, c.getInstructorName(),
        instructorAvatar,
        c.getAccent(), c.getCredits(), c.getSemester(), status,
        c.getStudentsCount(), modulesTotal, parseOutcomes(c.getOutcomesJson()),
        c.getThumbnailUrl(), c.getUpdatedAt(), c.getCreatedAt());
  }

  static List<String> parseOutcomes(String raw) {
    if (raw == null || raw.isBlank()) {
      return List.of();
    }
    try {
      List<String> parsed = JSON.readValue(raw, new TypeReference<List<String>>() {
      });
      return parsed == null ? List.of() : parsed.stream()
          .filter(s -> s != null && !s.isBlank()).toList();
    } catch (Exception ex) {
      return List.of();
    }
  }
}
