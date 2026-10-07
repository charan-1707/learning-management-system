package com.learnhub.lms.user;

import com.learnhub.lms.assignment.Grade;
import com.learnhub.lms.assignment.GradeRepository;
import com.learnhub.lms.attendance.AttendanceRecord;
import com.learnhub.lms.attendance.AttendanceRecordRepository;
import com.learnhub.lms.attendance.AttendanceStatus;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Derives {@link StudentRow}s live (plan §7): enrollment count, attendance %
 * from records, 10-scale GPA from grades. Nulls where there is no data yet —
 * never fake numbers.
 */
@Service
public class StudentDirectoryService {

  private final EnrollmentRepository enrollments;
  private final AttendanceRecordRepository records;
  private final GradeRepository grades;

  public StudentDirectoryService(EnrollmentRepository enrollments,
      AttendanceRecordRepository records, GradeRepository grades) {
    this.enrollments = enrollments;
    this.records = records;
    this.grades = grades;
  }

  @Transactional(readOnly = true)
  public StudentRow row(User u) {
    int courseCount = (int) enrollments.countByStudent_Id(u.getId());

    List<AttendanceRecord> att = records.findByStudent_Id(u.getId());
    Integer attendance = null;
    if (!att.isEmpty()) {
      long present = att.stream().filter(r -> r.getStatus() == AttendanceStatus.present).count();
      attendance = (int) Math.round(present * 100.0 / att.size());
    }

    List<Grade> gs = grades.findByStudent_Id(u.getId());
    Double gpa = null;
    if (!gs.isEmpty()) {
      double avgPct = gs.stream()
          .filter(g -> g.getMaxScore() != null && g.getMaxScore() > 0 && g.getScore() != null)
          .mapToDouble(g -> g.getScore() * 100.0 / g.getMaxScore())
          .average().orElse(Double.NaN);
      if (!Double.isNaN(avgPct)) {
        gpa = Math.round(avgPct / 10.0 * 10.0) / 10.0;
      }
    }

    return new StudentRow(u.getId(), u.getName(), u.getEmail(), u.getProgram(),
        u.getYearLabel(), courseCount, attendance, gpa,
        u.getStatus() == null ? null : u.getStatus().dbValue, u.getJoinedLabel());
  }
}
