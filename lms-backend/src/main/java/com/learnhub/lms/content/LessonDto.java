package com.learnhub.lms.content;

/** Lesson shape. {@code content} is nulled for locked (unenrolled) students. */
public record LessonDto(String id, String moduleId, String courseId, String title,
    String content, String type, String meta, Long sizeBytes, String fileUrl,
    Integer orderIndex) {

  public static LessonDto from(Lesson l, boolean hideContent) {
    String moduleId = l.getModule() == null ? null : l.getModule().getId();
    String courseId = l.getModule() == null || l.getModule().getCourse() == null ? null
        : l.getModule().getCourse().getId();
    return new LessonDto(l.getId(), moduleId, courseId, l.getTitle(),
        hideContent ? null : l.getContent(),
        l.getType() == null ? null : l.getType().name(),
        hideContent ? null : l.getMeta(), hideContent ? null : l.getSizeBytes(),
        hideContent ? null : l.getFileUrl(), l.getOrderIndex());
  }
}
