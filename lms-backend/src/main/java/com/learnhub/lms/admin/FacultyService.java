package com.learnhub.lms.admin;

import com.learnhub.lms.assignment.Submission;
import com.learnhub.lms.assignment.SubmissionDto;
import com.learnhub.lms.assignment.SubmissionRepository;
import com.learnhub.lms.assignment.SubmissionStatus;
import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.communication.Announcement;
import com.learnhub.lms.communication.AnnouncementRepository;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Faculty-scoped feeds (plan §9.10): ungraded inbox across owned courses and
 * a live activity feed derived from submissions + announcements (replaces the
 * static M.* feeds).
 */
@Service
public class FacultyService {

  private final SubmissionRepository submissions;
  private final AnnouncementRepository announcements;
  private final CourseRepository courses;
  private final Authz authz;

  public FacultyService(SubmissionRepository submissions,
      AnnouncementRepository announcements, CourseRepository courses, Authz authz) {
    this.submissions = submissions;
    this.announcements = announcements;
    this.courses = courses;
    this.authz = authz;
  }

  @Transactional(readOnly = true)
  public List<SubmissionDto> pendingSubmissions() {
    User me = authz.currentUser();
    requireFacultyOrAdmin(me);
    List<SubmissionDto> out = new ArrayList<>();
    for (Submission s : submissions.findAll()) {
      if (s.getStatus() != SubmissionStatus.graded && visibleTo(me, s.getCourse())) {
        out.add(SubmissionDto.from(s));
      }
    }
    out.sort(Comparator.comparing(SubmissionDto::submittedAt,
        Comparator.nullsLast(Comparator.reverseOrder())));
    return out;
  }

  @Transactional(readOnly = true)
  public List<ActivityDto> activity() {
    User me = authz.currentUser();
    requireFacultyOrAdmin(me);
    List<ActivityDto> out = new ArrayList<>();
    for (Course c : ownedCourses(me)) {
      String code = c.getCode() == null ? c.getId() : c.getCode();
      for (Submission s : submissions.findByCourse_Id(c.getId())) {
        out.add(new ActivityDto("submission",
            studentName(s) + " submitted \u201c" + assignmentTitle(s) + "\u201d",
            null, s.getSubmittedAt(), "submission"));
      }
      for (Announcement a : announcements.findByCourse_IdOrderByCreatedAtDesc(c.getId())) {
        out.add(new ActivityDto("announcement", "Posted \u201c" + a.getTitle() + "\u201d", code,
            a.getCreatedAt(), "announcement"));
      }
    }
    out.sort(Comparator.comparing(ActivityDto::time,
        Comparator.nullsLast(Comparator.reverseOrder())));
    return out.stream().limit(20).toList();
  }

  // ---- helpers ----

  private void requireFacultyOrAdmin(User me) {
    if (me.getRole() != Role.faculty && me.getRole() != Role.admin) {
      throw ApiException.forbidden("Forbidden");
    }
  }

  private List<Course> ownedCourses(User me) {
    if (me.getRole() == Role.admin) {
      return courses.findAll();
    }
    return courses.findByInstructor_Id(me.getId());
  }

  private boolean visibleTo(User me, Course course) {
    if (course == null) {
      return false;
    }
    if (me.getRole() == Role.admin) {
      return true;
    }
    return course.getInstructor() != null && course.getInstructor().getId().equals(me.getId());
  }

  private static String studentName(Submission s) {
    return s.getStudent() == null ? "A student" : s.getStudent().getName();
  }

  private static String assignmentTitle(Submission s) {
    return s.getAssignment() == null ? "an assignment" : s.getAssignment().getTitle();
  }
}
