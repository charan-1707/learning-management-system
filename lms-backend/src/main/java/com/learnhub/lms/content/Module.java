package com.learnhub.lms.content;

import com.learnhub.lms.course.Course;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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

/** 1:1 with §6.1 modules. Id scheme {@code <courseId>-m<num>} (from db.js buildSeeds). */
@Entity
@Table(name = "modules",
    uniqueConstraints = @UniqueConstraint(name = "uq_modules_course_order", columnNames = {"course_id", "order_index"}),
    indexes = @Index(name = "idx_modules_course", columnList = "course_id"))
public class Module {

  @Id
  private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "course_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Course course;

  @Column(length = 200)
  private String title;

  @Column(name = "order_index")
  private Integer orderIndex;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public Course getCourse() { return course; }
  public void setCourse(Course course) { this.course = course; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public Integer getOrderIndex() { return orderIndex; }
  public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
  @jakarta.persistence.PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
