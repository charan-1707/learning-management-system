package com.learnhub.lms.admin;

import java.time.LocalDateTime;

/** Feed row for admin + faculty activity (icon derived from type). */
public record ActivityDto(String icon, String text, String detail, LocalDateTime time,
    String type) {

  public static ActivityDto from(ActivityEvent e) {
    return new ActivityDto(iconFor(e.getType()), e.getText(), e.getDetail(),
        e.getCreatedAt(), e.getType());
  }

  static String iconFor(String type) {
    if (type == null) {
      return "system";
    }
    return switch (type) {
      case "student", "faculty", "user", "submission", "assignment", "quiz",
           "grade", "material", "course", "system", "announcement" -> type;
      default -> "system";
    };
  }
}
