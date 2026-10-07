package com.learnhub.lms.user;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * Public user shape. Never exposes password_hash — the session copy the
 * frontend keeps (`localStorage['learnhub-user']`) maps 1:1 to this.
 */
public record UserDto(Long id, String name, String email, String role, String status,
    String dept, String program, String yearLabel, String title, String phone,
    String location, String avatarUrl, LocalDateTime lastActiveAt, String joinedLabel) {

  private static final DateTimeFormatter JOINED_FMT = DateTimeFormatter.ofPattern("MMM yyyy");

  public static UserDto from(User u) {
    String joined = u.getJoinedLabel();
    if ((joined == null || joined.isBlank()) && u.getCreatedAt() != null) {
      joined = u.getCreatedAt().format(JOINED_FMT);
    }
    return new UserDto(u.getId(), u.getName(), u.getEmail(),
        u.getRole() == null ? null : u.getRole().name(),
        u.getStatus() == null ? null : u.getStatus().dbValue,
        u.getDept(), u.getProgram(), u.getYearLabel(), u.getTitle(), u.getPhone(),
        u.getLocation(), u.getAvatarUrl(), u.getLastActiveAt(), joined);
  }
}
