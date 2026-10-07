package com.learnhub.lms.assignment;

import com.learnhub.lms.course.Course;
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
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/**
 * 1:1 with §6.1 submissions. UNIQUE(assignment,student): one row per
 * student+assignment — resubmit-before-due is an upsert (§10.4).
 */
@Entity
@Table(name = "submissions",
    uniqueConstraints = @UniqueConstraint(name = "uq_sub_assign_student", columnNames = {"assignment_id", "student_id"}),
    indexes = {
        @Index(name = "idx_sub_assign_submitted", columnList = "assignment_id,submitted_at"),
        @Index(name = "idx_sub_course_status", columnList = "course_id,status"),
        @Index(name = "idx_sub_student", columnList = "student_id")})
public class Submission {

  @Id
  private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "assignment_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Assignment assignment;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "course_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Course course;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "student_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private User student;

  @Column(columnDefinition = "MEDIUMTEXT")
  private String content;

  @Column(name = "file_url", length = 500)
  private String fileUrl;

  private Integer score;

  @Column(columnDefinition = "TEXT")
  private String feedback;

  @Column(name = "graded_at")
  private LocalDateTime gradedAt;

  @Enumerated(EnumType.STRING)
  @Column(length = 10, columnDefinition = "ENUM('pending','reviewing','graded')")
  private SubmissionStatus status = SubmissionStatus.pending;

  @Column(name = "submitted_at")
  private LocalDateTime submittedAt;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public Assignment getAssignment() { return assignment; }
  public void setAssignment(Assignment assignment) { this.assignment = assignment; }
  public Course getCourse() { return course; }
  public void setCourse(Course course) { this.course = course; }
  public User getStudent() { return student; }
  public void setStudent(User student) { this.student = student; }
  public String getContent() { return content; }
  public void setContent(String content) { this.content = content; }
  public String getFileUrl() { return fileUrl; }
  public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
  public Integer getScore() { return score; }
  public void setScore(Integer score) { this.score = score; }
  public String getFeedback() { return feedback; }
  public void setFeedback(String feedback) { this.feedback = feedback; }
  public LocalDateTime getGradedAt() { return gradedAt; }
  public void setGradedAt(LocalDateTime gradedAt) { this.gradedAt = gradedAt; }
  public SubmissionStatus getStatus() { return status; }
  public void setStatus(SubmissionStatus status) { this.status = status; }
  public LocalDateTime getSubmittedAt() { return submittedAt; }
  public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
  @jakarta.persistence.PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
