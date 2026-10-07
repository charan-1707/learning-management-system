package com.learnhub.lms.attendance;

import java.time.LocalDate;
import java.util.List;

public record SessionDto(Long id, String courseId, LocalDate date, List<SessionRecordDto> records) {

  public record SessionRecordDto(Long studentId, String studentName, String status) {
  }
}
