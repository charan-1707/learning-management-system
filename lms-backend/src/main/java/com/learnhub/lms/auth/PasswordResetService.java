package com.learnhub.lms.auth;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Map;

/**
 * Email password-reset: single-use 15-minute tokens. The raw token only ever
 * travels by email; the DB keeps its SHA-256 hash. Unknown emails still get
 * {@code ok:true} so accounts cannot be enumerated. Without SMTP configured
 * ({@code spring.mail.host}) the link is logged for development instead.
 */
@Service
public class PasswordResetService {

  private static final Logger LOG = LoggerFactory.getLogger(PasswordResetService.class);
  private static final SecureRandom RANDOM = new SecureRandom();

  private final PasswordResetTokenRepository tokens;
  private final UserRepository users;
  private final PasswordEncoder passwords;

  @Autowired(required = false)
  private JavaMailSender mailer;

  @Value("${app.frontend-url:http://localhost:8000}")
  private String frontendUrl;

  @Value("${app.mail-from:no-reply@learnhub.local}")
  private String mailFrom;

  public PasswordResetService(PasswordResetTokenRepository tokens, UserRepository users,
      PasswordEncoder passwords) {
    this.tokens = tokens;
    this.users = users;
    this.passwords = passwords;
  }

  @Transactional
  public Map<String, Object> forgotPassword(String email) {
    String clean = email == null ? "" : email.trim().toLowerCase();
    users.findByEmail(clean).ifPresent(this::issueAndDeliver);
    return Map.of("ok", true);
  }

  @Transactional
  public Map<String, Object> resetPassword(String token, String newPassword) {
    PasswordResetToken row = tokens.findByTokenHash(sha256(token == null ? "" : token))
        .orElseThrow(() -> ApiException.badRequest("This reset link is invalid."));
    if (row.isUsed() || row.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw ApiException.badRequest("This reset link has expired. Request a new one.");
    }
    User user = row.getUser();
    user.setPasswordHash(passwords.encode(newPassword));
    users.save(user);
    row.setUsed(true);
    tokens.save(row);
    return Map.of("ok", true);
  }

  private void issueAndDeliver(User user) {
    byte[] bytes = new byte[32];
    RANDOM.nextBytes(bytes);
    String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    PasswordResetToken row = new PasswordResetToken();
    row.setUser(user);
    row.setTokenHash(sha256(raw));
    row.setExpiresAt(LocalDateTime.now().plusMinutes(15));
    tokens.save(row);
    String link = frontendUrl + "/pages/auth/reset-password.html?token=" + raw;
    if (mailer != null) {
      try {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(mailFrom);
        msg.setTo(user.getEmail());
        msg.setSubject("LearnHub password reset");
        msg.setText("Hi " + user.getName() + ",\n\nUse this link within 15 minutes to set a new password:\n"
            + link + "\n\nIf you did not request this, ignore this email.");
        mailer.send(msg);
        return;
      } catch (Exception ex) {
        LOG.warn("SMTP send failed, falling back to log", ex);
      }
    }
    LOG.info("DEV password-reset link for {}: {}", user.getEmail(), link);
  }

  public static String sha256(String raw) {
    try {
      byte[] digest = MessageDigest.getInstance("SHA-256")
          .digest(raw.getBytes(StandardCharsets.UTF_8));
      StringBuilder hex = new StringBuilder(64);
      for (byte b : digest) {
        hex.append(String.format("%02x", b));
      }
      return hex.toString();
    } catch (Exception ex) {
      throw new IllegalStateException("SHA-256 unavailable", ex);
    }
  }
}
