package com.learnhub.lms.assignment;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.communication.NotificationService;
import com.learnhub.lms.communication.NotificationType;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.enrollment.Enrollment;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.enrollment.EnrollmentStatus;
import com.learnhub.lms.user.User;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Assignment CRUD + per-student status derivation (plan §10).
 * Reads require enrolled/owner/admin; writes are owner/ADMIN.
 */
@Service
public class AssignmentService {

  private final AssignmentRepository assignments;
  private final SubmissionRepository submissions;
  private final CourseRepository courses;
  private final EnrollmentRepository enrollments;
  private final NotificationService notificationService;
  private final ObjectMapper json;
  private final Authz authz;

  public AssignmentService(AssignmentRepository assignments, SubmissionRepository submissions,
      CourseRepository courses, EnrollmentRepository enrollments,
      NotificationService notificationService, ObjectMapper json, Authz authz) {
    this.assignments = assignments;
    this.submissions = submissions;
    this.courses = courses;
    this.enrollments = enrollments;
    this.notificationService = notificationService;
    this.json = json;
    this.authz = authz;
  }

  @Transactional(readOnly = true)
  public List<AssignmentDto> forCourse(String courseId) {
    findCourseOr404(courseId);
    authz.requireEnrolledOrOwnerOrAdmin(courseId);
    return sorted(assignments.findByCourse_Id(courseId)).stream()
        .map(AssignmentDto::from).toList();
  }

  @Transactional
  public AssignmentDto create(String courseId, AssignmentCreateRequest req) {
    Course course = findCourseOr404(courseId);
    authz.requireOwnerOrAdmin(courseId);
    Assignment a = new Assignment();
    a.setId(nextAssignmentId());
    a.setCourse(course);
    a.setTitle(req.title().trim());
    a.setMaxMarks(req.resolvedMax());
    a.setDueAt(req.due());
    a.setDescription(req.description());
    a.setAttachmentsJson(writeAttachments(req.attachments()));
    a.setCreatedAt(LocalDateTime.now());
    a.setUpdatedAt(LocalDateTime.now());
    Assignment saved = assignments.save(a);
    String due = saved.getDueAt() == null ? "No due date set."
        : "Due " + saved.getDueAt().toLocalDate() + ".";
    notificationService.fanOut(courseId, NotificationType.assignment,
        "New assignment published",
        "\u201c" + saved.getTitle() + "\u201d is now open in "
            + notificationService.courseDisplayName(courseId) + ". " + due);
    return AssignmentDto.from(saved);
  }

  @Transactional(readOnly = true)
  public AssignmentDto get(String id) {
    Assignment a = findOr404(id);
    authz.requireEnrolledOrOwnerOrAdmin(a.getCourse().getId());
    return AssignmentDto.from(a);
  }

  @Transactional
  public AssignmentDto update(String id, AssignmentUpdateRequest req) {
    Assignment a = findOr404(id);
    authz.requireOwnerOrAdmin(a.getCourse().getId());
    if (req.title() != null) {
      a.setTitle(req.title().trim());
    }
    if (req.maxMarks() != null) {
      a.setMaxMarks(req.maxMarks());
    } else if (req.maxScore() != null) {
      a.setMaxMarks(req.maxScore());
    }
    if (req.due() != null) {
      a.setDueAt(req.due());
    }
    if (req.status() != null) {
      a.setStatus(req.status());
    }
    if (req.description() != null) {
      a.setDescription(req.description());
    }
    if (req.attachments() != null) {
      a.setAttachmentsJson(writeAttachments(req.attachments()));
    }
    a.setUpdatedAt(LocalDateTime.now());
    return AssignmentDto.from(assignments.save(a));
  }

  @Transactional
  public void delete(String id) {
    Assignment a = findOr404(id);
    authz.requireOwnerOrAdmin(a.getCourse().getId());
    assignments.delete(a);
  }

  @Transactional(readOnly = true)
  public List<AssignmentDto> myAssignments(String statusFilter) {
    User me = authz.currentUser();
    LocalDateTime now = LocalDateTime.now();
    List<AssignmentDto> out = new ArrayList<>();
    for (Enrollment e : enrollments.findByStudent_Id(me.getId())) {
      if (e.getStatus() != EnrollmentStatus.active) {
        continue;
      }
      Course course = e.getCourse();
      for (Assignment a : sorted(assignments.findByCourse_Id(course.getId()))) {
        var own = submissions.findByAssignment_IdAndStudent_Id(a.getId(), me.getId());
        boolean submitted = own.isPresent();
        boolean graded = submitted && own.get().getStatus() == SubmissionStatus.graded;
        String ownStatus;
        if (graded) {
          ownStatus = "graded";
        } else if (submitted) {
          ownStatus = "submitted";
        } else if (a.getDueAt() != null && a.getDueAt().isBefore(now)) {
          ownStatus = "overdue";
        } else {
          ownStatus = "not-started";
        }
        if (statusFilter != null && !statusFilter.isBlank() && !ownStatus.equals(statusFilter)) {
          continue;
        }
        Integer score = submitted ? own.get().getScore() : null;
        out.add(AssignmentDto.from(a).withOwn(ownStatus, submitted, graded, score));
      }
    }
    return out;
  }

  // ---- helpers ----

  private String writeAttachments(List<AssignmentAttachment> attachments) {
    if (attachments == null) {
      return null;
    }
    try {
      return json.writeValueAsString(attachments);
    } catch (JsonProcessingException ex) {
      throw ApiException.badRequest("Invalid attachments.");
    }
  }

  Assignment findOr404(String id) {
    return assignments.findById(id)
        .orElseThrow(() -> ApiException.notFound("Assignment not found."));
  }

  private Course findCourseOr404(String courseId) {
    return courses.findById(courseId)
        .orElseThrow(() -> ApiException.notFound("Course not found."));
  }

  /** due DESC, nulls last (plan §2.1 keeps frontend sort). */
  static List<Assignment> sorted(List<Assignment> in) {
    return in.stream()
        .sorted(Comparator.comparing(Assignment::getDueAt,
            Comparator.nullsLast(Comparator.reverseOrder())))
        .toList();
  }

  private String nextAssignmentId() {
    int max = 0;
    for (Assignment a : assignments.findAll()) {
      if (a.getId() != null && a.getId().matches("a\\d+")) {
        max = Math.max(max, Integer.parseInt(a.getId().substring(1)));
      }
    }
    return "a" + (max + 1);
  }
}
