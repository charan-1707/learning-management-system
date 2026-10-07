package com.learnhub.lms.assignment;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Grade reads: own grades, summary math, and the gradebook aggregation
 * (plan §9.6, §10.7). Writes happen only through grading (SubmissionService).
 */
@Service
public class GradeService {

  private final GradeRepository grades;
  private final AssignmentRepository assignments;
  private final SubmissionRepository submissions;
  private final CourseRepository courses;
  private final EnrollmentRepository enrollments;
  private final Authz authz;

  public GradeService(GradeRepository grades, AssignmentRepository assignments,
      SubmissionRepository submissions, CourseRepository courses,
      EnrollmentRepository enrollments, Authz authz) {
    this.grades = grades;
    this.assignments = assignments;
    this.submissions = submissions;
    this.courses = courses;
    this.enrollments = enrollments;
    this.authz = authz;
  }

  @Transactional(readOnly = true)
  public List<GradeDto> myGrades() {
    User me = authz.currentUser();
    return grades.findByStudent_IdOrderByGradedAtDesc(me.getId()).stream()
        .map(GradeDto::from).toList();
  }

  @Transactional(readOnly = true)
  public GradeSummaryDto summary() {
    User me = authz.currentUser();
    List<Grade> all = grades.findByStudent_IdOrderByGradedAtDesc(me.getId());
    List<GradeDto> dtos = all.stream().map(GradeDto::from).toList();
    List<Double> pcts = dtos.stream()
        .filter(g -> g.pct() != null).map(GradeDto::pct).toList();
    double average = pcts.isEmpty() ? 0.0
        : pcts.stream().mapToDouble(Double::doubleValue).average().orElse(0.0);
    GradeSummaryDto.BestGrade best = null;
    double top = -1;
    for (GradeDto g : dtos) {
      if (g.pct() != null && g.pct() > top) {
        top = g.pct();
        best = new GradeSummaryDto.BestGrade(g.courseName(), g.pct());
      }
    }
    return new GradeSummaryDto(average, dtos.size(), best, dtos.stream().limit(5).toList());
  }

  @Transactional(readOnly = true)
  public GradebookDto gradebook(String courseId) {
    if (!courses.existsById(courseId)) {
      throw ApiException.notFound("Course not found.");
    }
    authz.requireOwnerOrAdmin(courseId);
    List<GradebookDto.GradebookStudent> studentRows = new ArrayList<>();
    Map<String, Map<String, GradebookDto.GradeCell>> cells = new LinkedHashMap<>();
    for (var e : enrollments.findByCourse_Id(courseId)) {
      User s = e.getStudent();
      studentRows.add(new GradebookDto.GradebookStudent(s.getId(), s.getName(), s.getEmail()));
      cells.put(String.valueOf(s.getId()), new LinkedHashMap<>());
    }
    List<GradebookDto.GradebookAssignment> assignmentRows = AssignmentService
        .sorted(assignments.findByCourse_Id(courseId)).stream()
        .map(a -> new GradebookDto.GradebookAssignment(a.getId(), a.getTitle(),
            a.getMaxMarks(), a.getDueAt()))
        .toList();
    for (Submission s : submissions.findByCourse_Id(courseId)) {
      String sid = String.valueOf(s.getStudent().getId());
      String aid = s.getAssignment().getId();
      if (cells.containsKey(sid)) {
        cells.get(sid).put(aid, new GradebookDto.GradeCell(s.getScore(),
            s.getStatus() == null ? null : s.getStatus().name()));
      }
    }
    return new GradebookDto(studentRows, assignmentRows, cells);
  }
}
