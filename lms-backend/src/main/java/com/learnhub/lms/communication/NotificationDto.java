package com.learnhub.lms.communication;

import java.time.LocalDateTime;

public record NotificationDto(String id, String type, String title, String message,
    String courseId, boolean read, LocalDateTime createdAt) {

  public static NotificationDto from(Notification n) {
    return new NotificationDto(n.getId(),
        n.getType() == null ? null : n.getType().name(), n.getTitle(), n.getMessage(),
        n.getCourseId(), Boolean.TRUE.equals(n.getRead()), n.getCreatedAt());
  }
}
