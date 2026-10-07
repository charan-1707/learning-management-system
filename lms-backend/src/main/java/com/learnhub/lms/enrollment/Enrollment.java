package com.learnhub.lms.enrollment;

import com.learnhub.lms.course.Course;
import com.learnhub.lms.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

/** 1:1 with §6.1 enrollments. UNIQUE(student,course) enforces enroll-once (§10.1). */
@Entity
@Table(name = "enrollments",
    uniqueConstraints = @UniqueConstraint(name = "uq_enroll_student_course", columnNames = {"student_id", "course_id"}),
    indexes = @Index(name = "idx_enroll_course_status", columnList = "course_id,status"))
public class Enrollment {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "student_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private User student;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "course_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Course course;

  @Enumerated(EnumType.STRING)
  @Column(length = 10, columnDefinition = "ENUM('active','dropped')")
  private EnrollmentStatus status = EnrollmentStatus.active;

  @Column(name = "progress_percent")
  private Integer progressPercent = 0;

  @Column(name = "enrolled_at")
  private LocalDateTime enrolledAt;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public User getStudent() { return student; }
  public void setStudent(User student) { this.student = student; }
  public Course getCourse() { return course; }
  public void setCourse(Course course) { this.course = course; }
  public EnrollmentStatus getStatus() { return status; }
  public void setStatus(EnrollmentStatus status) { this.status = status; }
  public Integer getProgressPercent() { return progressPercent; }
  public void setProgressPercent(Integer progressPercent) { this.progressPercent = progressPercent; }
  public LocalDateTime getEnrolledAt() { return enrolledAt; }
  public void setEnrolledAt(LocalDateTime enrolledAt) { this.enrolledAt = enrolledAt; }
  @jakarta.persistence.PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
