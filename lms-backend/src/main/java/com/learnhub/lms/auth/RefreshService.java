package com.learnhub.lms.auth;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.config.JwtProps;
import com.learnhub.lms.security.JwtService;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserDto;
import com.learnhub.lms.user.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;

/**
 * Refresh rotation: short-lived JWT access tokens plus opaque 7-day refresh
 * tokens. Every use mints a fresh pair and revokes the old row; presenting
 * an already-revoked token burns the whole family (likely theft).
 */
@Service
public class RefreshService {

  private static final SecureRandom RANDOM = new SecureRandom();

  private final RefreshTokenRepository tokens;
  private final UserRepository users;
  private final JwtService jwt;
  private final JwtProps props;

  public RefreshService(RefreshTokenRepository tokens, UserRepository users,
      JwtService jwt, JwtProps props) {
    this.tokens = tokens;
    this.users = users;
    this.jwt = jwt;
    this.props = props;
  }

  /** Mint a fresh pair for a user; returns {accessToken, refreshToken(raw)}. */
  @Transactional
  public String[] issuePair(User user) {
    byte[] bytes = new byte[32];
    RANDOM.nextBytes(bytes);
    String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    RefreshToken row = new RefreshToken();
    row.setUser(user);
    row.setTokenHash(PasswordResetService.sha256(raw));
    row.setExpiresAt(LocalDateTime.now().plusDays(props.refreshDays()));
    tokens.save(row);
    String access = jwt.issueAccessToken(
        String.valueOf(user.getId()), user.getRole().name(), user.getEmail());
    return new String[] { access, raw };
  }

  // noRollbackFor: the theft-burn below writes revocations and then throws
  // 401 by design — those writes must commit, not roll back.
  @Transactional(noRollbackFor = ApiException.class)
  public ResponseEntity<AuthResponse> refresh(String rawToken) {
    String hash = PasswordResetService.sha256(rawToken == null ? "" : rawToken);
    RefreshToken row = tokens.findByTokenHash(hash).orElse(null);
    if (row == null || row.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw ApiException.unauthorized("Session expired. Please log in again.");
    }
    if (row.isRevoked()) {
      revokeAll(row.getUser().getId());
      throw ApiException.unauthorized("Session expired. Please log in again.");
    }
    User user = row.getUser();
    row.setRevoked(true);
    tokens.save(row);
    String[] pair = issuePair(user);
    return ResponseEntity.ok(AuthResponse.success(pair[0], pair[1], UserDto.from(user)));
  }

  @Transactional
  public Map<String, Object> logout(String rawToken) {
    if (rawToken != null && !rawToken.isBlank()) {
      tokens.findByTokenHash(PasswordResetService.sha256(rawToken)).ifPresent(row -> {
        row.setRevoked(true);
        tokens.save(row);
      });
    }
    return Map.of("ok", true);
  }

  @Transactional
  public Map<String, Object> logoutAll(Long userId) {
    revokeAll(userId);
    return Map.of("ok", true);
  }

  private void revokeAll(Long userId) {
    List<RefreshToken> fam = tokens.findByUser_Id(userId);
    for (RefreshToken t : fam) {
      if (!t.isRevoked()) {
        t.setRevoked(true);
        tokens.save(t);
      }
    }
  }
}
