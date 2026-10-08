package com.learnhub.lms.user;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * First-start safety net: with zero data (fresh database) nobody could log
 * in, so seed a single admin from environment when the users table is empty.
 * Existing databases are untouched. Change the password immediately.
 *
 * <p>Lockout recovery: if {@code app.admin-recovery-password} is set (env
 * {@code APP_ADMIN_RECOVERY_PASSWORD}), every boot resets that password onto
 * the primary admin (or the first admin found). Set it, redeploy, sign in,
 * change the password in Profile, then DELETE the variable — while set, each
 * restart re-applies it.</p>
 */
@Component
public class BootstrapAdminRunner implements CommandLineRunner {

  private static final Logger LOG = LoggerFactory.getLogger(BootstrapAdminRunner.class);

  private final UserRepository users;
  private final PasswordEncoder passwords;

  @Value("${app.bootstrap-admin-email:learnhub.edu.in@gmail.com}")
  private String email;

  @Value("${app.bootstrap-admin-password:learnhub17}")
  private String password;

  @Value("${app.bootstrap-admin-name:System Administrator}")
  private String name;

  @Value("${app.primary-admin-email:learnhub.edu.in@gmail.com}")
  private String primaryAdminEmail;

  @Value("${app.admin-recovery-password:}")
  private String recoveryPassword;

  public BootstrapAdminRunner(UserRepository users, PasswordEncoder passwords) {
    this.users = users;
    this.passwords = passwords;
  }

  @Override
  public void run(String... args) {
    applyRecoveryPassword();
    final long count;
    try {
      count = users.count();
    } catch (Exception ex) {
      // Slice tests (no JPA/tables): nothing to bootstrap.
      LOG.debug("Bootstrap check skipped (no users table available).");
      return;
    }
    if (count > 0) {
      return;
    }
    String cleanEmail = email.trim().toLowerCase();
    User admin = new User();
    admin.setName(name);
    admin.setEmail(cleanEmail);
    admin.setPasswordHash(passwords.encode(password));
    admin.setRole(Role.admin);
    admin.setStatus(UserStatus.active);
    admin.setEmailVerified(true);
    users.save(admin);
    LOG.warn("Users table was empty: bootstrapped admin {} — change its password now.", cleanEmail);
  }

  /**
   * Lockout recovery: when {@code APP_ADMIN_RECOVERY_PASSWORD} is set, reset
   * it onto the primary admin (else the first admin found), reactivate and
   * mark verified. Runs on every boot while the variable is set — delete it
   * right after signing in.
   */
  private void applyRecoveryPassword() {
    if (recoveryPassword == null || recoveryPassword.isBlank()) {
      return;
    }
    User target = null;
    try {
      target = users.findByEmail(primaryAdminEmail.trim().toLowerCase()).orElse(null);
      if (target == null) {
        target = users.findAll().stream()
            .filter(u -> u.getRole() == Role.admin)
            .findFirst().orElse(null);
      }
    } catch (Exception ex) {
      LOG.debug("Recovery check skipped (no users table available).");
      return;
    }
    if (target == null) {
      LOG.warn("APP_ADMIN_RECOVERY_PASSWORD is set but no admin account exists yet.");
      return;
    }
    target.setPasswordHash(passwords.encode(recoveryPassword));
    target.setStatus(UserStatus.active);
    target.setEmailVerified(true);
    users.save(target);
    LOG.warn("Admin password reset via APP_ADMIN_RECOVERY_PASSWORD for {} — "
        + "sign in now, change it in Profile, then DELETE the variable.", target.getEmail());
  }
}
