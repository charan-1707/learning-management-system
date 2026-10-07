package com.learnhub.lms.communication;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Announcements + notifications (plan §9.9). */
@RestController
@Tag(name = "communication", description = "Announcements and notifications")
public class CommunicationController {

  private final AnnouncementService announcements;
  private final NotificationService notifications;

  public CommunicationController(AnnouncementService announcements,
      NotificationService notifications) {
    this.announcements = announcements;
    this.notifications = notifications;
  }

  @GetMapping("/api/courses/{id}/announcements")
  @Operation(summary = "Course announcements, newest first")
  public List<AnnouncementDto> forCourse(@PathVariable String id) {
    return announcements.forCourse(id);
  }

  @PostMapping("/api/courses/{id}/announcements")
  @Operation(summary = "Post announcement, fans out to enrolled students (owner/ADMIN)")
  public ResponseEntity<AnnouncementDto> create(@PathVariable String id,
      @Valid @RequestBody AnnouncementCreateRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(announcements.create(id, req));
  }

  @DeleteMapping("/api/announcements/{id}")
  @Operation(summary = "Delete announcement (owner/ADMIN)")
  public Map<String, Object> delete(@PathVariable String id) {
    announcements.delete(id);
    return Map.of("ok", true);
  }

  @GetMapping("/api/notifications/me")
  @Operation(summary = "Own notifications, newest first (self)")
  public List<NotificationDto> mine() {
    return notifications.mine();
  }

  @GetMapping("/api/notifications/unread-count")
  @Operation(summary = "Own unread count for badges (self)")
  public Map<String, Object> unreadCount() {
    return notifications.unreadCount();
  }

  @PatchMapping("/api/notifications/{id}/read")
  @Operation(summary = "Mark own notification read (self)")
  public Map<String, Object> markRead(@PathVariable String id) {
    notifications.markRead(id);
    return Map.of("ok", true);
  }

  @PostMapping("/api/notifications/read-all")
  @Operation(summary = "Mark all own notifications read (self)")
  public Map<String, Object> markAllRead() {
    notifications.markAllRead();
    return Map.of("ok", true);
  }

  @PostMapping("/api/notifications/broadcast")
  @Operation(summary = "Platform broadcast to every user as a system notification (ADMIN)")
  public Map<String, Object> broadcast(@Valid @RequestBody NotificationBroadcastRequest req) {
    int recipients = notifications.broadcastAll(req.title().trim(), req.message().trim());
    return Map.of("ok", true, "recipients", recipients);
  }
}
