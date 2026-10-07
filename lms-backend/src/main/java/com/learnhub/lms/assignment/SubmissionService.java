package com.learnhub.lms.assignment;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.communication.NotificationService;
import com.learnhub.lms.communication.NotificationType;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Submission + grading loop (plan §10, mirrors DB.submit / submissions.grade).
 * Upsert submit, pair-validated grading, and every grade also lands a
 * {@code grades} row so gradebook/summary unify (§11.4 fix from day one).
 */
@Service
public class SubmissionService {

  private final AssignmentService assignmentService;
  private final SubmissionRepository submissions;
  private final GradeRepository grades;
  private final EnrollmentRepository enrollments;
  private final NotificationService notificationService;
  private final Authz authz;

  public SubmissionService(AssignmentService assignmentService, SubmissionRepository submissions,
      GradeRepository grades, EnrollmentRepository enrollments,
      NotificationService notificationService, Authz authz) {
    this.assignmentService = assignmentService;
    this.submissions = submissions;
    this.grades = grades;
    this.enrollments = enrollments;
    this.notificationService = notificationService;
    this.authz = authz;
  }

  @Transactional
  public SubmissionDto submit(String assignmentId, SubmitRequest req) {
    User me = authz.currentUser();
    Assignment a = assignmentService.findOr404(assignmentId);
    String courseId = a.getCourse().getId();
    if (!enrollments.existsByStudent_IdAndCourse_Id(me.getId(), courseId)) {
      throw ApiException.badRequest("You must be enrolled in this course to submit.");
    }
    if (a.getDueAt() != null && a.getDueAt().isBefore(LocalDateTime.now())) {
      throw ApiException.badRequest("This assignment is past its due date.");
    }
    Submission s = submissions.findByAssignment_IdAndStudent_Id(assignmentId, me.getId())
        .orElseGet(() -> {
          Submission created = new Submission();
          created.setId(nextSubmissionId());
          created.setAssignment(a);
          created.setCourse(a.getCourse());
          created.setStudent(me);
          return created;
        });
    boolean resubmit = s.getSubmittedAt() != null;
    s.setContent(req.content());
    s.setFileUrl(req.fileUrl());
    s.setSubmittedAt(LocalDateTime.now());
    if (resubmit) {
      // Resubmit-before-due resets grading fields (§10.4) + clears the grade row.
      s.setScore(null);
      s.setFeedback(null);
      s.setGradedAt(null);
      s.setStatus(SubmissionStatus.pending);
      grades.deleteAll(grades.findByCourse_IdAndStudent_IdAndAssessmentAndType(
          courseId, me.getId(), a.getTitle(), GradeType.assignment));
    } else {
      s.setStatus(SubmissionStatus.pending);
    }
    SubmissionDto saved = SubmissionDto.from(submissions.save(s));
    User instructor = a.getCourse().getInstructor();
    if (instructor != null) {
      notificationService.notifyUser(instructor, NotificationType.assignment,
          "New submission",
          me.getName() + " submitted \u201c" + a.getTitle() + "\u201d"
              + (resubmit ? " (resubmission)" : "") + ".",
          courseId);
    }
    return saved;
  }

  @Transactional(readOnly = true)
  public List<SubmissionDto> forAssignment(String assignmentId) {
    Assignment a = assignmentService.findOr404(assignmentId);
    authz.requireOwnerOrAdmin(a.getCourse().getId());
    return submissions.findByAssignment_IdOrderBySubmittedAtDesc(assignmentId).stream()
        .map(SubmissionDto::from).toList();
  }

  @Transactional(readOnly = true)
  public List<SubmissionDto> forCourse(String courseId, boolean ungradedOnly) {
    authz.requireOwnerOrAdmin(courseId);
    List<Submission> all = new ArrayList<>(submissions.findByCourse_Id(courseId));
    all.sort(Comparator.comparing(Submission::getSubmittedAt,
        Comparator.nullsLast(Comparator.reverseOrder())));
    return all.stream()
        .filter(s -> !ungradedOnly || s.getStatus() != SubmissionStatus.graded)
        .map(SubmissionDto::from).toList();
  }

  @Transactional(readOnly = true)
  public List<SubmissionDto> mine(String assignmentId) {
    User me = authz.currentUser();
    List<Submission> all = submissions.findByStudent_Id(me.getId());
    return all.stream()
        .filter(s -> assignmentId == null || assignmentId.isBlank()
            || (s.getAssignment() != null && s.getAssignment().getId().equals(assignmentId)))
        .sorted(Comparator.comparing(Submission::getSubmittedAt,
            Comparator.nullsLast(Comparator.reverseOrder())))
        .map(SubmissionDto::from).toList();
  }

  @Transactional
  public SubmissionDto grade(String submissionId, GradeRequest req) {
    Submission s = submissions.findById(submissionId)
        .orElseThrow(() -> ApiException.notFound("Submission not found."));
    authz.requireOwnerOrAdmin(s.getCourse().getId());
    if (s.getAssignment() == null || !s.getAssignment().getId().equals(req.assignmentId())) {
      throw ApiException.badRequest("Submission does not belong to this assignment.");
    }
    Assignment a = s.getAssignment();
    int max = a.getMaxMarks() == null ? 20 : a.getMaxMarks();
    if (req.score() > max) {
      throw ApiException.badRequest("Score cannot exceed " + max + " marks.");
    }
    s.setScore(req.score());
    s.setFeedback(req.feedback());
    s.setGradedAt(LocalDateTime.now());
    s.setStatus(SubmissionStatus.graded);
    submissions.save(s);

    Course course = s.getCourse();
    User student = s.getStudent();
    List<Grade> existing = grades.findByCourse_IdAndStudent_IdAndAssessmentAndType(
        course.getId(), student.getId(), a.getTitle(), GradeType.assignment);
    Grade g = existing.isEmpty() ? new Grade() : existing.get(0);
    g.setCourse(course);
    g.setStudent(student);
    g.setAssessment(a.getTitle());
    g.setType(GradeType.assignment);
    g.setScore(req.score());
    g.setMaxScore(max);
    g.setGradedAt(LocalDateTime.now());
    grades.save(g);
    notificationService.notifyUser(student, NotificationType.grade, "Grade published",
        "Your result for \u201c" + a.getTitle() + "\u201d (" + req.score() + "/" + max
            + ") is now available.",
        course.getId());
    return SubmissionDto.from(s);
  }

  // ---- helpers ----

  private String nextSubmissionId() {
    int max = 0;
    for (Submission s : submissions.findAll()) {
      if (s.getId() != null && s.getId().matches("s\\d+")) {
        max = Math.max(max, Integer.parseInt(s.getId().substring(1)));
      }
    }
    return "s" + (max + 1);
  }
}
