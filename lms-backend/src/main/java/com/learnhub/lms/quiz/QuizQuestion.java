package com.learnhub.lms.quiz;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/** 1:1 with §6.1 quiz_questions. Options stored as JSON; answer stripped for students (Phase 6). */
@Entity
@Table(name = "quiz_questions",
    uniqueConstraints = @UniqueConstraint(name = "uq_qq_quiz_position", columnNames = {"quiz_id", "position"}))
public class QuizQuestion {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "quiz_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Quiz quiz;

  private Integer position;

  @Column(columnDefinition = "TEXT")
  private String question;

  @Column(name = "options_json", nullable = false, columnDefinition = "JSON")
  private String optionsJson;

  @Column(name = "answer_index", nullable = false)
  private Integer answerIndex;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Quiz getQuiz() { return quiz; }
  public void setQuiz(Quiz quiz) { this.quiz = quiz; }
  public Integer getPosition() { return position; }
  public void setPosition(Integer position) { this.position = position; }
  public String getQuestion() { return question; }
  public void setQuestion(String question) { this.question = question; }
  public String getOptionsJson() { return optionsJson; }
  public void setOptionsJson(String optionsJson) { this.optionsJson = optionsJson; }
  public Integer getAnswerIndex() { return answerIndex; }
  public void setAnswerIndex(Integer answerIndex) { this.answerIndex = answerIndex; }
}
