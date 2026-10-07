package com.learnhub.lms.attendance;

import com.learnhub.lms.course.Course;
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
import java.time.LocalDate;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/** 1:1 with §6.1 attendance_sessions. UNIQUE(course,date): take-session is an upsert (Phase 7). */
@Entity
@Table(name = "attendance_sessions",
    uniqueConstraints = @UniqueConstraint(name = "uq_asess_course_date", columnNames = {"course_id", "session_date"}))
public class AttendanceSession {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "course_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Course course;

  @Column(name = "session_date")
  private LocalDate sessionDate;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Course getCourse() { return course; }
  public void setCourse(Course course) { this.course = course; }
  public LocalDate getSessionDate() { return sessionDate; }
  public void setSessionDate(LocalDate sessionDate) { this.sessionDate = sessionDate; }
}
