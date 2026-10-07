package com.learnhub.lms.content;

/**
 * Module shape. {@code locked=true} for students not enrolled in the course
 * (materials hidden — frontend shows the lock state, plan §8).
 */
public record ModuleDto(String id, String courseId, String title, Integer orderIndex,
    long lessonCount, boolean locked) {

  public static ModuleDto from(Module m, long lessonCount, boolean locked) {
    String courseId = m.getCourse() == null ? null : m.getCourse().getId();
    return new ModuleDto(m.getId(), courseId, m.getTitle(), m.getOrderIndex(), lessonCount, locked);
  }
}
