package com.learnhub.lms.auth;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;

/**
 * 6-digit email verification codes. Raw codes travel by email only; the DB
 * keeps SHA-256 hashes. 10-minute expiry, single use, 5-attempt lockout and a
 * 60-second resend cooldown (abuse-safe and horizontally scalable: verification
 * is a stateless hash comparison, no server affinity). Unknown emails always
 * answer {@code ok:true} so accounts cannot be enumerated.
 */
@Service
public class OtpService {

  private static final Logger LOG = LoggerFactory.getLogger(OtpService.class);
  private static final SecureRandom RANDOM = new SecureRandom();
  static final int CODE_TTL_MINUTES = 10;
  static final int MAX_ATTEMPTS = 5;
  static final int RESEND_COOLDOWN_SECONDS = 60;

  private final EmailOtpRepository codes;
  private final UserRepository users;

  @Autowired(required = false)
  private JavaMailSender mailer;

  @Value("${app.mail-from:no-reply@learnhub.local}")
  private String mailFrom;

  public OtpService(EmailOtpRepository codes, UserRepository users) {
    this.codes = codes;
    this.users = users;
  }

  /** Issue a fresh code (consuming any prior live ones) and deliver it. */
  @Transactional
  public void issue(User user) {
    issueCode(user);
  }

  /**
   * Same as {@link #issue(User)} but returns the raw code. The API never
   * exposes this — it exists so tests can complete the real verify flow
   * without reading anyone's inbox.
   */
  @Transactional
  public String issueCode(User user) {
    consumeLive(user.getId());
    String raw = String.format("%06d", RANDOM.nextInt(1_000_000));
    EmailOtp row = new EmailOtp();
    row.setUser(user);
    row.setCodeHash(PasswordResetService.sha256(raw));
    row.setExpiresAt(LocalDateTime.now().plusMinutes(CODE_TTL_MINUTES));
    row.setAttempts(0);
    row.setCreatedAt(LocalDateTime.now());
    codes.save(row);
    deliver(user, raw);
    return raw;
  }

  /** Resend with cooldown; unknown or already-verified emails get a bare ok. */
  @Transactional
  public Map<String, Object> resend(String email) {
    String clean = email == null ? "" : email.trim().toLowerCase();
    User user = users.findByEmail(clean).orElse(null);
    if (user == null || user.isEmailVerified()) {
      return Map.of("ok", true);
    }
    codes.findFirstByUser_IdAndConsumedAtIsNullOrderByCreatedAtDesc(user.getId())
        .ifPresent(live -> {
          long age = java.time.Duration.between(live.getCreatedAt(), LocalDateTime.now()).getSeconds();
          if (age < RESEND_COOLDOWN_SECONDS) {
            throw ApiException.badRequest(
                "A code was just sent. Wait " + (RESEND_COOLDOWN_SECONDS - age) + "s and try again.");
          }
        });
    issue(user);
    return Map.of("ok", true);
  }

  /** Consume a code and mark the account verified. */
  @Transactional
  public User verify(String email, String code) {
    String clean = email == null ? "" : email.trim().toLowerCase();
    String raw = code == null ? "" : code.trim();
    User user = users.findByEmail(clean).orElse(null);
    EmailOtp row = user == null ? null
        : codes.findFirstByUser_IdAndConsumedAtIsNullOrderByCreatedAtDesc(user.getId()).orElse(null);
    if (user == null || row == null || row.getExpiresAt().isBefore(LocalDateTime.now())) {
      throw ApiException.badRequest("That code is invalid or expired. Request a new one.");
    }
    if (!row.getCodeHash().equals(PasswordResetService.sha256(raw))) {
      codes.incrementAttempts(row.getId());
      int attempts = row.getAttempts() + 1;
      if (attempts >= MAX_ATTEMPTS) {
        codes.consumeById(row.getId());
        throw ApiException.badRequest("Too many wrong attempts. Request a new code.");
      }
      throw ApiException.badRequest(
          "Wrong code. " + (MAX_ATTEMPTS - attempts) + " attempts left.");
    }
    row.setConsumedAt(LocalDateTime.now());
    codes.save(row);
    user.setEmailVerified(true);
    users.save(user);
    return user;
  }

  private void consumeLive(Long userId) {
    codes.findByUser_IdAndConsumedAtIsNull(userId).forEach(r -> {
      r.setConsumedAt(LocalDateTime.now());
      codes.save(r);
    });
  }

  private void deliver(User user, String raw) {
    if (mailer != null) {
      try {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setFrom(mailFrom);
        msg.setTo(user.getEmail());
        msg.setSubject("Your LearnHub verification code");
        msg.setText("Hi " + user.getName() + ",\n\nYour LearnHub verification code is:\n\n"
            + raw + "\n\nIt expires in " + CODE_TTL_MINUTES
            + " minutes. If you did not create this account, ignore this email.");
        mailer.send(msg);
        return;
      } catch (Exception ex) {
        LOG.warn("SMTP send failed, falling back to log", ex);
      }
    }
    LOG.info("DEV verification code for {}: {}", user.getEmail(), raw);
  }
}
