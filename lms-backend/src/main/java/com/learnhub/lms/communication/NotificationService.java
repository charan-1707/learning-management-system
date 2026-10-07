package com.learnhub.lms.communication;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.course.Course;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.enrollment.Enrollment;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Notifications are strictly per-student: every id is resolved against the
 * JWT user, never a client param (plan §10.3).
 */
@Service
public class NotificationService {

  private final NotificationRepository notifications;
  private final EnrollmentRepository enrollments;
  private final CourseRepository courses;
  private final UserRepository users;
  private final Authz authz;

  public NotificationService(NotificationRepository notifications,
      EnrollmentRepository enrollments, CourseRepository courses,
      UserRepository users, Authz authz) {
    this.notifications = notifications;
    this.enrollments = enrollments;
    this.courses = courses;
    this.users = users;
    this.authz = authz;
  }

  @Transactional(readOnly = true)
  public List<NotificationDto> mine() {
    User me = authz.currentUser();
    return notifications.findByUser_IdOrderByCreatedAtDesc(me.getId()).stream()
        .map(NotificationDto::from).toList();
  }

  @Transactional
  public void markRead(String id) {
    User me = authz.currentUser();
    Notification n = notifications.findById(id)
        .filter(x -> x.getUser() != null && x.getUser().getId().equals(me.getId()))
        .orElseThrow(() -> ApiException.notFound("Notification not found."));
    n.setRead(true);
    notifications.save(n);
  }

  @Transactional
  public void markAllRead() {
    User me = authz.currentUser();
    List<Notification> all = notifications.findByUser_IdOrderByCreatedAtDesc(me.getId());
    for (Notification n : all) {
      n.setRead(true);
    }
    notifications.saveAll(all);
  }

  @Transactional(readOnly = true)
  public Map<String, Object> unreadCount() {
    User me = authz.currentUser();
    return Map.of("count", notifications.countByUser_IdAndReadFalse(me.getId()));
  }

  /**
   * Fan-out helper for course events (plan §12): one row per enrolled
   * student. Used by announcements, assignments and quizzes alike.
   */
  @Transactional
  public void fanOut(String courseId, NotificationType type, String title, String message) {
    List<Enrollment> roster = enrollments.findByCourse_Id(courseId);
    for (Enrollment e : roster) {
      if (e.getStudent() == null) {
        continue;
      }
      Notification n = new Notification();
      n.setId(nextId());
      n.setUser(e.getStudent());
      n.setType(type);
      n.setTitle(title);
      n.setMessage(message);
      n.setCourseId(courseId);
      n.setRead(false);
      n.setCreatedAt(LocalDateTime.now());
      notifications.save(n);
    }
  }

  /** Single-user notification (grading, enrollment confirmations, …). */
  @Transactional
  public void notifyUser(User user, NotificationType type, String title, String message,
      String courseId) {
    Notification n = new Notification();
    n.setId(nextId());
    n.setUser(user);
    n.setType(type);
    n.setTitle(title);
    n.setMessage(message);
    n.setCourseId(courseId);
    n.setRead(false);
    n.setCreatedAt(LocalDateTime.now());
    notifications.save(n);
  }

  /**
   * Platform broadcast (ADMIN): one {@code system} notification per user, so
   * students, faculty and admins all receive it in their own inbox.
   * No course scope (courseId stays null).
   *
   * @return number of recipients
   */
  @Transactional
  public int broadcastAll(String title, String message) {
    authz.requireAdmin();
    List<User> recipients = users.findAll();
    int next = maxNotificationNumber() + 1;
    for (User recipient : recipients) {
      Notification n = new Notification();
      n.setId("n" + (next++));
      n.setUser(recipient);
      n.setType(NotificationType.system);
      n.setTitle(title);
      n.setMessage(message);
      n.setCourseId(null);
      n.setRead(false);
      n.setCreatedAt(LocalDateTime.now());
      notifications.save(n);
    }
    return recipients.size();
  }

  public String courseDisplayName(String courseId) {
    Course course = courses.findById(courseId).orElse(null);
    if (course == null) {
      return courseId;
    }
    return course.getShortName() == null ? course.getName() : course.getShortName();
  }

  private String nextId() {
    return "n" + (maxNotificationNumber() + 1);
  }

  private int maxNotificationNumber() {
    int max = 0;
    for (Notification n : notifications.findAll()) {
      if (n.getId() != null && n.getId().matches("n\\d+")) {
        max = Math.max(max, Integer.parseInt(n.getId().substring(1)));
      }
    }
    return max;
  }
}
