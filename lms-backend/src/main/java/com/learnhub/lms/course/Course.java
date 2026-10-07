package com.learnhub.lms.course;

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
import java.time.LocalDateTime;

/** 1:1 with §6.1 courses. String PK (cs201…) — never break ?id= deep links. */
@Entity
@Table(name = "courses", indexes = @Index(name = "idx_courses_status_cat_instr", columnList = "status,category,instructor_id"))
public class Course {

  @Id
  private String id;

  @Column(length = 20)
  private String code;

  @Column(nullable = false, length = 200)
  private String name;

  @Column(name = "short_name", length = 200)
  private String shortName;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(length = 80)
  private String category;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "instructor_id")
  private User instructor;

  @Column(name = "instructor_name", length = 120)
  private String instructorName;

  @Column(length = 20)
  private String accent = "blue";

  private Integer credits = 3;

  @Column(length = 40)
  private String semester;

  @Enumerated(EnumType.STRING)
  @Column(length = 20, columnDefinition = "ENUM('published','draft')")
  private CourseStatus status;

  @Column(name = "students_count")
  private Integer studentsCount = 0;

  @Column(name = "outcomes_json", columnDefinition = "JSON")
  private String outcomesJson;

  @Column(name = "thumbnail_url", length = 500)
  private String thumbnailUrl;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public String getCode() { return code; }
  public void setCode(String code) { this.code = code; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getShortName() { return shortName; }
  public void setShortName(String shortName) { this.shortName = shortName; }
  public String getDescription() { return description; }
  public void setDescription(String description) { this.description = description; }
  public String getCategory() { return category; }
  public void setCategory(String category) { this.category = category; }
  public User getInstructor() { return instructor; }
  public void setInstructor(User instructor) { this.instructor = instructor; }
  public String getInstructorName() { return instructorName; }
  public void setInstructorName(String instructorName) { this.instructorName = instructorName; }
  public String getAccent() { return accent; }
  public void setAccent(String accent) { this.accent = accent; }
  public Integer getCredits() { return credits; }
  public void setCredits(Integer credits) { this.credits = credits; }
  public String getSemester() { return semester; }
  public void setSemester(String semester) { this.semester = semester; }
  public CourseStatus getStatus() { return status; }
  public void setStatus(CourseStatus status) { this.status = status; }
  public Integer getStudentsCount() { return studentsCount; }
  public void setStudentsCount(Integer studentsCount) { this.studentsCount = studentsCount; }
  public String getOutcomesJson() { return outcomesJson; }
  public void setOutcomesJson(String outcomesJson) { this.outcomesJson = outcomesJson; }
  public String getThumbnailUrl() { return thumbnailUrl; }
  public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
  @jakarta.persistence.PrePersist
  void prePersist() {
    LocalDateTime now = LocalDateTime.now();
    if (createdAt == null) {
      createdAt = now;
    }
    if (updatedAt == null) {
      updatedAt = now;
    }
  }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
  public LocalDateTime getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
