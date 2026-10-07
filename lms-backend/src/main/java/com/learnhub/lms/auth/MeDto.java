package com.learnhub.lms.auth;

import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserDto;

import java.time.LocalDateTime;

/** Live-session shape for GET /api/auth/me (same fields as the stored session copy). */
public record MeDto(Long id, String name, String email, String role, String status,
    String dept, String program, String yearLabel, String title, String phone,
    String location, String avatarUrl, LocalDateTime lastActiveAt, String joinedLabel) {

  public static MeDto from(User u) {
    UserDto d = UserDto.from(u);
    return new MeDto(d.id(), d.name(), d.email(), d.role(), d.status(), d.dept(),
        d.program(), d.yearLabel(), d.title(), d.phone(), d.location(), d.avatarUrl(),
        d.lastActiveAt(), d.joinedLabel());
  }
}
