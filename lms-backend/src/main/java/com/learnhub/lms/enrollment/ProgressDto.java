package com.learnhub.lms.enrollment;

import java.util.List;

/**
 * Progress shape. Formula fixed (§10.6):
 * {@code percent = total==0 ? 0 : round(completed/total*100)}.
 * {@code completedLessonIds} powers per-lesson checkmarks in the UI.
 */
public record ProgressDto(int total, int completed, int percent, List<String> completedLessonIds) {

  public ProgressDto(int total, int completed, int percent) {
    this(total, completed, percent, List.of());
  }
}
