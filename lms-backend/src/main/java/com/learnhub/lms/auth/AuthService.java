package com.learnhub.lms.auth;

import com.learnhub.lms.admin.PlatformSettings;
import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.security.JwtService;
import org.springframework.beans.factory.annotation.Value;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserDto;
import com.learnhub.lms.user.UserRepository;
import com.learnhub.lms.user.UserStatus;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Login rules (plan §7): BCrypt check, suspended gate, last-active touch.
 * Controllers stay thin; everything below is the unit under test.
 */
@Service
public class AuthService {

  private final UserRepository users;
  private final PasswordEncoder passwords;
  private final JwtService jwt;
  private final PlatformSettings platform;
  private final RefreshService refresh;
  private final OtpService otp;

  /* Pilot escape hatch (default ON = normal OTP flow): when false, email
     ownership is not required — registration signs the student straight in
     and login never bounces unverified accounts. For closed pilots where
     email delivery is unavailable; admins vouch for identities instead. */
  @Value("${app.require-email-verification:true}")
  private boolean requireEmailVerification;

  public AuthService(UserRepository users, PasswordEncoder passwords, JwtService jwt,
      PlatformSettings platform, RefreshService refresh, OtpService otp) {
    this.users = users;
    this.passwords = passwords;
    this.jwt = jwt;
    this.platform = platform;
    this.refresh = refresh;
    this.otp = otp;
  }

  @Transactional
  public ResponseEntity<AuthResponse> login(String email, String password) {
    User user = users.findByEmail(email).orElse(null);
    if (user == null || !passwords.matches(password, user.getPasswordHash())) {
      return ResponseEntity.ok(AuthResponse.failed());
    }
    if (user.getStatus() == UserStatus.suspended) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(AuthResponse.suspendedDenied());
    }
    // Email ownership is proven by OTP before first access: correct password
    // on an unverified account answers ok:false (same soft shape as a wrong
    // password) so the client can route to the code screen. Skipped entirely
    // when verification is disabled (closed pilot, no email delivery).
    if (!user.isEmailVerified() && requireEmailVerification) {
      return ResponseEntity.ok(AuthResponse.unverifiedDenied());
    }
    if (platform.isEnabled("maintenanceMode", false) && user.getRole() != Role.admin) {
      throw ApiException.maintenance("LearnHub is in maintenance mode. Please try again later.");
    }
    user.setLastActiveAt(LocalDateTime.now());
    users.save(user);
    String[] pair = refresh.issuePair(user);
    return ResponseEntity.ok(AuthResponse.success(pair[0], pair[1], UserDto.from(user)));
  }

  @Transactional
  public ResponseEntity<AuthResponse> register(String name, String email, String password) {
    if (platform.isEnabled("maintenanceMode", false)) {
      throw ApiException.maintenance("LearnHub is in maintenance mode. Please try again later.");
    }
    if (!platform.isEnabled("selfRegistration", true)) {
      throw ApiException.forbidden("Self-registration is disabled. Ask your administrator for an account.");
    }
    String cleanEmail = email == null ? "" : email.trim().toLowerCase();
    if (users.findByEmail(cleanEmail).isPresent()) {
      throw ApiException.conflict("An account with this email already exists.");
    }
    User user = new User();
    user.setName(name.trim());
    user.setEmail(cleanEmail);
    user.setPasswordHash(passwords.encode(password));
    user.setRole(Role.student);
    user.setStatus(UserStatus.active);
    user.setEmailVerified(!requireEmailVerification);
    User saved = users.save(user);
    if (!requireEmailVerification) {
      // Closed pilot, no email delivery: skip OTP, sign straight in.
      saved.setLastActiveAt(LocalDateTime.now());
      users.save(saved);
      String[] pair = refresh.issuePair(saved);
      return ResponseEntity.ok(AuthResponse.success(pair[0], pair[1], UserDto.from(saved)));
    }
    // No login tokens yet: the inbox owns this address until the OTP proves it.
    otp.issue(saved);
    return ResponseEntity.status(201).body(AuthResponse.pendingVerification(cleanEmail));
  }

  /** Consume an OTP code and open the session (first login, with tokens). */
  @Transactional
  public ResponseEntity<AuthResponse> verifyOtp(String email, String code) {
    User user = otp.verify(email, code);
    if (user.getStatus() == UserStatus.suspended) {
      return ResponseEntity.status(HttpStatus.FORBIDDEN).body(AuthResponse.suspendedDenied());
    }
    if (platform.isEnabled("maintenanceMode", false) && user.getRole() != Role.admin) {
      throw ApiException.maintenance("LearnHub is in maintenance mode. Please try again later.");
    }
    user.setLastActiveAt(LocalDateTime.now());
    users.save(user);
    String[] pair = refresh.issuePair(user);
    return ResponseEntity.ok(AuthResponse.success(pair[0], pair[1], UserDto.from(user)));
  }

  @Transactional(readOnly = true)
  public MeDto me(Long userId) {
    if (userId == null) {
      throw ApiException.unauthorized("Unauthorized");
    }
    User user = users.findById(userId)
        .orElseThrow(() -> ApiException.unauthorized("Unauthorized"));
    return MeDto.from(user);
  }
}
