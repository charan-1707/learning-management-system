package com.learnhub.lms.quiz;

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
import java.time.LocalDateTime;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/** 1:1 with §6.1 quiz_attempts. Server-scored in Phase 6; table exists from Phase 1. */
@Entity
@Table(name = "quiz_attempts", indexes = @Index(name = "idx_qa_quiz_student", columnList = "quiz_id,student_id"))
public class QuizAttempt {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "quiz_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Quiz quiz;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "student_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private User student;

  @Column(name = "answers_json", columnDefinition = "JSON")
  private String answersJson;

  private Integer score;

  private Integer total;

  private Integer pct;

  @Column(name = "started_at")
  private LocalDateTime startedAt;

  @Column(name = "submitted_at")
  private LocalDateTime submittedAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Quiz getQuiz() { return quiz; }
  public void setQuiz(Quiz quiz) { this.quiz = quiz; }
  public User getStudent() { return student; }
  public void setStudent(User student) { this.student = student; }
  public String getAnswersJson() { return answersJson; }
  public void setAnswersJson(String answersJson) { this.answersJson = answersJson; }
  public Integer getScore() { return score; }
  public void setScore(Integer score) { this.score = score; }
  public Integer getTotal() { return total; }
  public void setTotal(Integer total) { this.total = total; }
  public Integer getPct() { return pct; }
  public void setPct(Integer pct) { this.pct = pct; }
  public LocalDateTime getStartedAt() { return startedAt; }
  public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
  public LocalDateTime getSubmittedAt() { return submittedAt; }
  public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }
}
