package com.learnhub.lms.admin;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/** 1:1 with §6.1 activity_events. Feeds admin + faculty activity (§13.6 audit). */
@Entity
@Table(name = "activity_events", indexes = @Index(name = "idx_activity_created", columnList = "created_at"))
public class ActivityEvent {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "actor_id")
  private Long actorId;

  @Column(length = 40)
  private String type;

  @Column(length = 300)
  private String text;

  @Column(length = 500)
  private String detail;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public Long getActorId() { return actorId; }
  public void setActorId(Long actorId) { this.actorId = actorId; }
  public String getType() { return type; }
  public void setType(String type) { this.type = type; }
  public String getText() { return text; }
  public void setText(String text) { this.text = text; }
  public String getDetail() { return detail; }
  public void setDetail(String detail) { this.detail = detail; }
  @jakarta.persistence.PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
