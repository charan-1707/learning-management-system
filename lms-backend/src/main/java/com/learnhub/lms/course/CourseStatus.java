package com.learnhub.lms.course;

/**
 * Mirrors courses.status ENUM('published','draft') — NULL means legacy published (§2.2),
 * so the entity field stays nullable with no default.
 */
public enum CourseStatus {
  published,
  draft
}
