package com.learnhub.lms.communication;

import java.time.LocalDateTime;

public record AnnouncementDto(String id, String courseId, Long authorId, String authorName,
    String title, String body, LocalDateTime createdAt) {

  public static AnnouncementDto from(Announcement a) {
    return new AnnouncementDto(a.getId(),
        a.getCourse() == null ? null : a.getCourse().getId(),
        a.getAuthorId(), null, a.getTitle(), a.getBody(), a.getCreatedAt());
  }

  public AnnouncementDto withAuthorName(String authorName) {
    return new AnnouncementDto(id, courseId, authorId, authorName, title, body, createdAt);
  }
}
