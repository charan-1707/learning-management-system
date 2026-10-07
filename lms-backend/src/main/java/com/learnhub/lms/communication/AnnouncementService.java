package com.learnhub.lms.communication;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Announcements with fan-out: creating one notifies every enrolled student
 * (plan §12). Reads are enrolled/owner/admin; writes are owner/ADMIN.
 */
@Service
public class AnnouncementService {

  private final AnnouncementRepository announcements;
  private final NotificationService notificationService;
  private final CourseRepository courses;
  private final UserRepository users;
  private final Authz authz;

  public AnnouncementService(AnnouncementRepository announcements,
      NotificationService notificationService, CourseRepository courses,
      UserRepository users, Authz authz) {
    this.announcements = announcements;
    this.notificationService = notificationService;
    this.courses = courses;
    this.users = users;
    this.authz = authz;
  }

  @Transactional(readOnly = true)
  public List<AnnouncementDto> forCourse(String courseId) {
    if (!courses.existsById(courseId)) {
      throw ApiException.notFound("Course not found.");
    }
    authz.requireEnrolledOrOwnerOrAdmin(courseId);
    return announcements.findByCourse_IdOrderByCreatedAtDesc(courseId).stream()
        .map(a -> AnnouncementDto.from(a).withAuthorName(authorName(a.getAuthorId())))
        .toList();
  }

  @Transactional
  public AnnouncementDto create(String courseId, AnnouncementCreateRequest req) {
    Course course = courses.findById(courseId)
        .orElseThrow(() -> ApiException.notFound("Course not found."));
    authz.requireOwnerOrAdmin(courseId);
    User me = authz.currentUser();
    Announcement a = new Announcement();
    a.setId(nextId());
    a.setCourse(course);
    a.setAuthorId(me.getId());
    a.setTitle(req.title().trim());
    a.setBody(req.body());
    a.setCreatedAt(LocalDateTime.now());
    announcements.save(a);
    String courseName = course.getShortName() == null ? course.getName() : course.getShortName();
    notificationService.fanOut(courseId, NotificationType.course, "New announcement",
        a.getTitle() + " — " + courseName + ".");
    return AnnouncementDto.from(a).withAuthorName(me.getName());
  }

  @Transactional
  public void delete(String id) {
    Announcement a = announcements.findById(id)
        .orElseThrow(() -> ApiException.notFound("Announcement not found."));
    authz.requireOwnerOrAdmin(a.getCourse().getId());
    announcements.delete(a);
  }

  // ---- helpers ----

  private String authorName(Long authorId) {
    if (authorId == null) {
      return null;
    }
    return users.findById(authorId).map(User::getName).orElse(null);
  }

  private String nextId() {
    int max = 0;
    for (Announcement a : announcements.findAll()) {
      if (a.getId() != null && a.getId().matches("an\\d+")) {
        max = Math.max(max, Integer.parseInt(a.getId().substring(2)));
      }
    }
    return "an" + (max + 1);
  }
}
