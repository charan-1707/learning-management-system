package com.learnhub.lms.content;

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
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

/** 1:1 with §6.1 lessons. Id scheme {@code <courseId>-l<globalSeq>} (from db.js buildSeeds). */
@Entity
@Table(name = "lessons", indexes = @Index(name = "idx_lessons_module", columnList = "module_id"))
public class Lesson {

  @Id
  private String id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "module_id", nullable = false)
  @OnDelete(action = OnDeleteAction.CASCADE)
  private Module module;

  @Column(length = 250)
  private String title;

  @Column(columnDefinition = "TEXT")
  private String content;

  @Enumerated(EnumType.STRING)
  @Column(length = 10, columnDefinition = "ENUM('pdf','video','link')")
  private LessonType type;

  @Column(length = 250)
  private String meta;

  @Column(name = "size_bytes")
  private Long sizeBytes;

  @Column(name = "file_url", length = 500)
  private String fileUrl;

  @Column(name = "order_index")
  private Integer orderIndex;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public Module getModule() { return module; }
  public void setModule(Module module) { this.module = module; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getContent() { return content; }
  public void setContent(String content) { this.content = content; }
  public LessonType getType() { return type; }
  public void setType(LessonType type) { this.type = type; }
  public String getMeta() { return meta; }
  public void setMeta(String meta) { this.meta = meta; }
  public Long getSizeBytes() { return sizeBytes; }
  public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }
  public String getFileUrl() { return fileUrl; }
  public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }
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
