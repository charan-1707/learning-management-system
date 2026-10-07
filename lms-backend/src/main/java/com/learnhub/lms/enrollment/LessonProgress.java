package com.learnhub.lms.enrollment;

import com.learnhub.lms.content.Lesson;
import com.learnhub.lms.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/** 1:1 with §6.1 lesson_progress. UNIQUE(student,lesson) makes complete idempotent (§10.6). */
@Entity
@Table(name = "lesson_progress",
    uniqueConstraints = @UniqueConstraint(name = "uq_lp_student_lesson", columnNames = {"student_id", "lesson_id"}),
    indexes = @Index(name = "idx_lp_student", columnList = "student_id"))
public class LessonProgress {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "student_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private User student;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "lesson_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Lesson lesson;

  @Column(name = "completed_at")
  private LocalDateTime completedAt;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public User getStudent() { return student; }
  public void setStudent(User student) { this.student = student; }
  public Lesson getLesson() { return lesson; }
  public void setLesson(Lesson lesson) { this.lesson = lesson; }
  public LocalDateTime getCompletedAt() { return completedAt; }
  public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
  @jakarta.persistence.PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
