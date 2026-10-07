package com.learnhub.lms.storage;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/** 1:1 with §6.1 stored_files. Row per upload; bytes live under ./uploads (Phase 7). */
@Entity
@Table(name = "stored_files")
public class StoredFile {

  @Id
  private String id;

  @Column(name = "owner_id")
  private Long ownerId;

  @Column(length = 255)
  private String name;

  @Column(length = 120)
  private String mime;

  @Column(name = "size_bytes")
  private Long sizeBytes;

  @Column(length = 500)
  private String path;

  @Column(name = "created_at")
  private LocalDateTime createdAt;

  public String getId() { return id; }
  public void setId(String id) { this.id = id; }
  public Long getOwnerId() { return ownerId; }
  public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getMime() { return mime; }
  public void setMime(String mime) { this.mime = mime; }
  public Long getSizeBytes() { return sizeBytes; }
  public void setSizeBytes(Long sizeBytes) { this.sizeBytes = sizeBytes; }
  public String getPath() { return path; }
  public void setPath(String path) { this.path = path; }
  @jakarta.persistence.PrePersist
  void prePersist() {
    if (createdAt == null) {
      createdAt = LocalDateTime.now();
    }
  }

  public LocalDateTime getCreatedAt() { return createdAt; }
  public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
