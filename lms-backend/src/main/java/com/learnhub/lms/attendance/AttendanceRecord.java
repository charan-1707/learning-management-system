package com.learnhub.lms.attendance;

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
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/** 1:1 with §6.1 attendance_records. Aggregates (§9.8) are computed from these rows. */
@Entity
@Table(name = "attendance_records",
    uniqueConstraints = @UniqueConstraint(name = "uq_arec_session_student", columnNames = {"session_id", "student_id"}),
    indexes = @Index(name = "idx_arec_student", columnList = "student_id"))
public class AttendanceRecord {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "session_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private AttendanceSession session;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "student_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private User student;

  @Enumerated(EnumType.STRING)
  @Column(length = 10, columnDefinition = "ENUM('present','absent')")
  private AttendanceStatus status;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public AttendanceSession getSession() { return session; }
  public void setSession(AttendanceSession session) { this.session = session; }
  public User getStudent() { return student; }
  public void setStudent(User student) { this.student = student; }
  public AttendanceStatus getStatus() { return status; }
  public void setStatus(AttendanceStatus status) { this.status = status; }
}
