package com.learnhub.lms.communication;

import com.learnhub.lms.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/** 1:1 with §6.1 notifications. Per-student isolation: user comes from JWT, never client params (§10.3). */
@Entity
@Table(name = "notifications", indexes = @Index(name = "idx_notif_user_read_created", columnList = "user_id,is_read,created_at"))
public class Notification {

  @Id
  private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private User user;

  @Enumerated(EnumType.STRING)
  @Column(length = 20, columnDefinition = "ENUM('assignment','quiz','grade','course','system')")
  private NotificationType type;

  @Column(length = 250)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String message;

  @Column(name = "course_id", length = 16)
  private String courseId;

  @Column(name = "is_read")
  private Boolean read = false;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public User getUser() { return user; }
  public void setUser(User user) { this.user = user; }
  public NotificationType getType() { return type; }
  public void setType(NotificationType type) { this.type = type; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public String getCourseId() { return courseId; }
  public void setCourseId(String courseId) { this.courseId = courseId; }
  public Boolean getRead() { return read; }
  public void setRead(Boolean read) { this.read = read; }
  @jakarta.persistence.PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
