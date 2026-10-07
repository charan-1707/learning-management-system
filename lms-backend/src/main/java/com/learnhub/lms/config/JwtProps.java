package com.learnhub.lms.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Binds {@code app.jwt.*} from application.yml.
 *
 * <p>Phase 0: only the secret + expiries are needed. Full auth (Phase 2)
 * uses this for issuing/parsing JWTs (sub=userId, role, email).</p>
 */
@ConfigurationProperties(prefix = "app.jwt")
public record JwtProps(String secret, long accessMinutes, long refreshDays) {

  public JwtProps {
    if (secret == null || secret.length() < 32) {
      throw new IllegalStateException(
          "app.jwt.secret must be >= 32 chars (set JWT_SECRET env var in production).");
    }
  }
}
