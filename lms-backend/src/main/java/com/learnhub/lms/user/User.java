package com.learnhub.lms.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

/** 1:1 with §6.1 users. Demo ids 101/102/103/201/202/203/207/5 preserved via V3 seeds. */
@Entity
@Table(name = "users", indexes = @Index(name = "idx_users_role_status", columnList = "role,status"))
public class User {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(nullable = false, unique = true, length = 190)
  private String email;

  @Column(name = "password_hash", nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20, columnDefinition = "ENUM('student','faculty','admin')")
  private Role role;

  @Column(length = 20, columnDefinition = "ENUM('active','suspended','warning','on-leave')")
  private UserStatus status = UserStatus.active;

  @Column(length = 120)
  private String dept;

  @Column(length = 120)
  private String program;

  @Column(name = "year_label", length = 20)
  private String yearLabel;

  @Column(length = 120)
  private String title;

  @Column(length = 40)
  private String phone;

  @Column(length = 120)
  private String location;

  @Column(name = "avatar_url", length = 500)
  private String avatarUrl;

  @Column(name = "email_verified", nullable = false)
  private boolean emailVerified;

  @Column(name = "last_active_at")
  private LocalDateTime lastActiveAt;

  @Column(name = "joined_label", length = 40)
  private String joinedLabel;

  @Column(name = "created_at", updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  public Long getId() { return id; }
  public void setId(Long id) { this.id = id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getEmail() { return email; }
  public void setEmail(String email) { this.email = email; }
  public String getPasswordHash() { return passwordHash; }
  public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
  public Role getRole() { return role; }
  public void setRole(Role role) { this.role = role; }
  public UserStatus getStatus() { return status; }
  public void setStatus(UserStatus status) { this.status = status; }
  public String getDept() { return dept; }
  public void setDept(String dept) { this.dept = dept; }
  public String getProgram() { return program; }
  public void setProgram(String program) { this.program = program; }
  public String getYearLabel() { return yearLabel; }
  public void setYearLabel(String yearLabel) { this.yearLabel = yearLabel; }
  public String getTitle() { return title; }
  public void setTitle(String title) { this.title = title; }
  public String getPhone() { return phone; }
  public void setPhone(String phone) { this.phone = phone; }
  public String getLocation() { return location; }
  public void setLocation(String location) { this.location = location; }
  public String getAvatarUrl() { return avatarUrl; }
  public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
  public boolean isEmailVerified() { return emailVerified; }
  public void setEmailVerified(boolean emailVerified) { this.emailVerified = emailVerified; }
  public LocalDateTime getLastActiveAt() { return lastActiveAt; }
  public void setLastActiveAt(LocalDateTime lastActiveAt) { this.lastActiveAt = lastActiveAt; }
  public String getJoinedLabel() { return joinedLabel; }
  public void setJoinedLabel(String joinedLabel) { this.joinedLabel = joinedLabel; }
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
