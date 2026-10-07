package com.learnhub.lms.assignment;

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
import java.time.LocalDateTime;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * 1:1 with §6.1 grades. Written alongside grading from day one (§10.7 fix for
 * the frontend's dual-source quirk — never replicate the quirk server-side).
 */
@Entity
@Table(name = "grades", indexes = {
    @Index(name = "idx_grades_student_date", columnList = "student_id,graded_at"),
    @Index(name = "idx_grades_course", columnList = "course_id")})
public class Grade {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "course_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Course course;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "student_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private User student;

  @Column(length = 250)
  private String assessment;

  @Enumerated(EnumType.STRING)
  @Column(length = 20, columnDefinition = "ENUM('assignment','quiz','exam')")
  private GradeType type;

  private Integer score;

  @Column(name = "max_score")
  private Integer maxScore;

  @Column(name = "graded_at")
  private LocalDateTime gradedAt;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Course getCourse() { return course; }
  public void setCourse(Course course) { this.course = course; }
  public User getStudent() { return student; }
  public void setStudent(User student) { this.student = student; }
  public String getAssessment() { return assessment; }
  public void setAssessment(String assessment) { this.assessment = assessment; }
  public GradeType getType() { return type; }
  public void setType(GradeType type) { this.type = type; }
  public Integer getScore() { return score; }
  public void setScore(Integer score) { this.score = score; }
  public Integer getMaxScore() { return maxScore; }
  public void setMaxScore(Integer maxScore) { this.maxScore = maxScore; }
  public LocalDateTime getGradedAt() { return gradedAt; }
  public void setGradedAt(LocalDateTime gradedAt) { this.gradedAt = gradedAt; }
  @jakarta.persistence.PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
