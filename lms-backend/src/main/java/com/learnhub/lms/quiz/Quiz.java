package com.learnhub.lms.quiz;

import com.learnhub.lms.course.Course;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/** 1:1 with §6.1 quizzes. taken/bestScore are per-student derivations (Phase 6), never columns. */
@Entity
@Table(name = "quizzes", indexes = @Index(name = "idx_quiz_course_due", columnList = "course_id,due_at"))
public class Quiz {

  @Id
  private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "course_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Course course;

  @Column(length = 250)
  private String title;

  @Column(name = "duration_min")
  private Integer durationMin;

  @Column(name = "attempts_max")
  private Integer attemptsMax = 2;

  @Column(name = "due_at")
  private LocalDateTime dueAt;

  @Column(length = 30)
  private String status;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public Course getCourse() { return course; }
  public void setCourse(Course course) { this.course = course; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public Integer getDurationMin() { return durationMin; }
  public void setDurationMin(Integer durationMin) { this.durationMin = durationMin; }
  public Integer getAttemptsMax() { return attemptsMax; }
  public void setAttemptsMax(Integer attemptsMax) { this.attemptsMax = attemptsMax; }
  public LocalDateTime getDueAt() { return dueAt; }
  public void setDueAt(LocalDateTime dueAt) { this.dueAt = dueAt; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  @jakarta.persistence.PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
