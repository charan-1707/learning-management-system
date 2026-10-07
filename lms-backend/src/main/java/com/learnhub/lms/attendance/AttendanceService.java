package com.learnhub.lms.attendance;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.enrollment.Enrollment;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Attendance aggregates computed from records (plan §12). Students read only
 * their own rows; take-session upserts per (course, date) for owner/ADMIN.
 */
@Service
public class AttendanceService {

  private final AttendanceSessionRepository sessions;
  private final AttendanceRecordRepository records;
  private final CourseRepository courses;
  private final EnrollmentRepository enrollments;
  private final UserRepository users;
  private final Authz authz;

  public AttendanceService(AttendanceSessionRepository sessions,
      AttendanceRecordRepository records, CourseRepository courses,
      EnrollmentRepository enrollments, UserRepository users, Authz authz) {
    this.sessions = sessions;
    this.records = records;
    this.courses = courses;
    this.enrollments = enrollments;
    this.users = users;
    this.authz = authz;
  }

  @Transactional(readOnly = true)
  public List<CourseAttendanceDto> myAttendance() {
    User me = authz.currentUser();
    Map<String, int[]> byCourse = new LinkedHashMap<>();
    for (AttendanceRecord r : records.findByStudent_Id(me.getId())) {
      Course c = r.getSession().getCourse();
      int[] acc = byCourse.computeIfAbsent(c.getId(), k -> new int[2]);
      if (r.getStatus() == AttendanceStatus.present) {
        acc[0]++;
      }
      acc[1]++;
    }
    List<CourseAttendanceDto> out = new ArrayList<>();
    for (var entry : byCourse.entrySet()) {
      Course c = courses.findById(entry.getKey()).orElse(null);
      if (c == null) {
        continue;
      }
      int present = entry.getValue()[0];
      int total = entry.getValue()[1];
      String name = c.getShortName() == null ? c.getName() : c.getShortName();
      out.add(new CourseAttendanceDto(c.getId(), name, present, total, pct(present, total)));
    }
    return out;
  }

  @Transactional(readOnly = true)
  public OverallAttendanceDto overall() {
    User me = authz.currentUser();
    List<AttendanceRecord> all = records.findByStudent_Id(me.getId());
    int present = 0;
    for (AttendanceRecord r : all) {
      if (r.getStatus() == AttendanceStatus.present) {
        present++;
      }
    }
    long courses = all.stream().map(r -> r.getSession().getCourse().getId()).distinct().count();
    return new OverallAttendanceDto(present, all.size(), pct(present, all.size()), (int) courses);
  }

  @Transactional(readOnly = true)
  public List<AttendanceHistoryRow> history() {
    User me = authz.currentUser();
    List<AttendanceRecord> all = records.findByStudent_Id(me.getId());
    all.sort(Comparator.comparing((AttendanceRecord r) -> r.getSession().getSessionDate(),
        Comparator.nullsLast(Comparator.reverseOrder())));
    List<AttendanceHistoryRow> out = new ArrayList<>();
    WeekFields weeks = WeekFields.of(Locale.getDefault());
    for (AttendanceRecord r : all) {
      Course c = r.getSession().getCourse();
      LocalDate date = r.getSession().getSessionDate();
      String week = date == null ? null : "Week " + date.get(weeks.weekOfYear());
      String name = c.getShortName() == null ? c.getName() : c.getShortName();
      out.add(new AttendanceHistoryRow(date, c.getId(), name,
          r.getStatus() == null ? null : r.getStatus().name(), week));
    }
    return out;
  }

  @Transactional
  public SessionDto takeSession(String courseId, SessionCreateRequest req) {
    if (!courses.existsById(courseId)) {
      throw ApiException.notFound("Course not found.");
    }
    authz.requireOwnerOrAdmin(courseId);
    if (req.date() != null && req.date().isAfter(LocalDate.now())) {
      throw ApiException.badRequest("Cannot record attendance for a future date.");
    }
    AttendanceSession session = sessions.findByCourse_IdAndSessionDate(courseId, req.date())
        .orElseGet(() -> {
          AttendanceSession created = new AttendanceSession();
          created.setCourse(courses.findById(courseId).orElseThrow());
          created.setSessionDate(req.date());
          return sessions.save(created);
        });
    List<SessionDto.SessionRecordDto> rows = new ArrayList<>();
    for (AttendanceRecordInput in : req.records()) {
      User student = users.findById(in.studentId())
          .orElseThrow(() -> ApiException.badRequest("Student not found: " + in.studentId()));
      AttendanceRecord rec = records.findBySession_IdAndStudent_Id(session.getId(), student.getId())
          .orElseGet(() -> {
            AttendanceRecord created = new AttendanceRecord();
            created.setSession(session);
            created.setStudent(student);
            return created;
          });
      rec.setStatus(AttendanceStatus.valueOf(in.status()));
      records.save(rec);
      rows.add(new SessionDto.SessionRecordDto(student.getId(), student.getName(),
          rec.getStatus().name()));
    }
    return new SessionDto(session.getId(), courseId, session.getSessionDate(), rows);
  }

  @Transactional(readOnly = true)
  public SessionDto sessionByDate(String courseId, LocalDate date) {
    if (!courses.existsById(courseId)) {
      throw ApiException.notFound("Course not found.");
    }
    authz.requireOwnerOrAdmin(courseId);
    AttendanceSession session = sessions.findByCourse_IdAndSessionDate(courseId, date)
        .orElseThrow(() -> ApiException.notFound("No session recorded on this date."));
    List<SessionDto.SessionRecordDto> rows = new ArrayList<>();
    for (AttendanceRecord r : records.findBySession_Id(session.getId())) {
      rows.add(new SessionDto.SessionRecordDto(r.getStudent().getId(),
          r.getStudent().getName(), r.getStatus().name()));
    }
    return new SessionDto(session.getId(), courseId, session.getSessionDate(), rows);
  }

  @Transactional(readOnly = true)
  public ClassAttendanceDto classView(String courseId) {
    if (!courses.existsById(courseId)) {
      throw ApiException.notFound("Course not found.");
    }
    authz.requireOwnerOrAdmin(courseId);
    List<ClassAttendanceDto.SessionSummary> summaries = new ArrayList<>();
    int present = 0;
    int total = 0;
    for (AttendanceSession s : sessions.findByCourse_IdOrderBySessionDateDesc(courseId)) {
      List<AttendanceRecord> recs = records.findBySession_Id(s.getId());
      int p = 0;
      for (AttendanceRecord r : recs) {
        if (r.getStatus() == AttendanceStatus.present) {
          p++;
        }
      }
      int absent = recs.size() - p;
      present += p;
      total += recs.size();
      summaries.add(new ClassAttendanceDto.SessionSummary(s.getId(), s.getSessionDate(),
          p, absent, recs.size(), pct(p, recs.size())));
    }
    int absent = total - present;
    return new ClassAttendanceDto(summaries, new ClassAttendanceDto.ClassOverall(
        summaries.size(), present, absent, total, pct(present, total)));
  }

  /** Shared by AdminService.studentProgress: -1 when the student has no records here. */
  public int attendancePct(Long studentId, String courseId) {
    int present = 0;
    int total = 0;
    for (AttendanceRecord r : records.findByStudent_Id(studentId)) {
      if (r.getSession().getCourse().getId().equals(courseId)) {
        total++;
        if (r.getStatus() == AttendanceStatus.present) {
          present++;
        }
      }
    }
    return total == 0 ? -1 : pct(present, total);
  }

  List<Enrollment> enrollmentsOf(String courseId) {
    return enrollments.findByCourse_Id(courseId);
  }

  private static int pct(int present, int total) {
    return total == 0 ? 0 : (int) Math.round(present * 100.0 / total);
  }
}
