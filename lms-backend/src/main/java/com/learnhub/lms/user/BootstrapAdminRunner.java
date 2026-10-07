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

  public BootstrapAdminRunner(UserRepository users, PasswordEncoder passwords) {
    this.users = users;
    this.passwords = passwords;
  }

  @Override
  public void run(String... args) {
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
}
