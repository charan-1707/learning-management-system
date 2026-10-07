package com.learnhub.lms.assignment;

import com.learnhub.lms.course.Course;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/** 1:1 with §6.1 assignments. Sort default: due DESC (plan §2.1). */
@Entity
@Table(name = "assignments", indexes = @Index(name = "idx_assign_course_due", columnList = "course_id,due_at"))
public class Assignment {

  @Id
  private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "course_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Course course;

  @Column(length = 250)
  private String title;

  @Column(name = "max_marks")
  private Integer maxMarks = 20;

  @Column(name = "due_at")
  private LocalDateTime dueAt;

  @Column(length = 30)
  private String status;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Lob
  @Column(name = "attachments_json", columnDefinition = "LONGTEXT")
  private String attachmentsJson;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public Course getCourse() { return course; }
  public void setCourse(Course course) { this.course = course; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public Integer getMaxMarks() { return maxMarks; }
  public void setMaxMarks(Integer maxMarks) { this.maxMarks = maxMarks; }
  public LocalDateTime getDueAt() { return dueAt; }
  public void setDueAt(LocalDateTime dueAt) { this.dueAt = dueAt; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getAttachmentsJson() { return attachmentsJson; }
  public void setAttachmentsJson(String attachmentsJson) { this.attachmentsJson = attachmentsJson; }
  @jakarta.persistence.PrePersist
  void prePersist() {
    LocalDateTime now = LocalDateTime.now();
    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
  }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
