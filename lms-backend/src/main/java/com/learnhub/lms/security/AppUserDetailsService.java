package com.learnhub.lms.security;

import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Phase 2: JPA-backed principals (subject = numeric user id). Suspended users
 * are reported disabled so any DAO-based check also denies them.
 */
@Service
public class AppUserDetailsService implements UserDetailsService {

  private final UserRepository users;

  public AppUserDetailsService(UserRepository users) {
    this.users = users;
  }

  @Override
  public UserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
    User user;
    try {
      user = users.findById(Long.valueOf(userId)).orElse(null);
    } catch (NumberFormatException ex) {
      user = null;
    }
    if (user == null) {
      throw new UsernameNotFoundException("Unknown user: " + userId);
    }
    String role = user.getRole() == null ? "student" : user.getRole().name();
    boolean suspended = user.getStatus() != null && user.getStatus().name().equals("suspended");
    return org.springframework.security.core.userdetails.User.withUsername(String.valueOf(user.getId()))
        .password(user.getPasswordHash())
        .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase())))
        .accountExpired(false)
        .accountLocked(false)
        .credentialsExpired(false)
        .disabled(suspended)
        .build();
  }

  /** Build an in-memory principal from validated JWT claims (no DB hit). */
  public UserDetails fromClaims(String userId, String role) {
    return org.springframework.security.core.userdetails.User.withUsername(userId)
        .password("{noop}jwt")
        .authorities(List.of(new SimpleGrantedAuthority("ROLE_" + (role == null ? "STUDENT" : role.toUpperCase()))))
        .accountExpired(false)
        .accountLocked(false)
        .credentialsExpired(false)
        .disabled(false)
        .build();
  }
}
