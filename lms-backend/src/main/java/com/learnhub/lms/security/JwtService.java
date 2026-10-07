package com.learnhub.lms.security;

import com.learnhub.lms.config.JwtProps;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT issue/parse. Fully implemented in Phase 0 so later phases inherit auth.
 *
 * <p>Payload: {@code sub=userId, role, email}. Access TTL from
 * {@code app.jwt.access-minutes} (default 60).</p>
 */
@Service
public class JwtService {

  private final JwtProps props;
  private final SecretKey key;

  public JwtService(JwtProps props) {
    this.props = props;
    this.key = Keys.hmacShaKeyFor(props.secret().getBytes(StandardCharsets.UTF_8));
  }

  public String issueAccessToken(String userId, String role, String email) {
    long ttlMs = props.accessMinutes() * 60_000L;
    Date now = new Date();
    return Jwts.builder()
        .subject(userId)
        .claim("role", role)
        .claim("email", email)
        .issuedAt(now)
        .expiration(new Date(now.getTime() + ttlMs))
        .signWith(key)
        .compact();
  }

  public Claims parse(String token) {
    return Jwts.parser()
        .verifyWith(key)
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }
}
