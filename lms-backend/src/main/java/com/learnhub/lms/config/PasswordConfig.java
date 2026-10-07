package com.learnhub.lms.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Password hashing for Phase 2 seeds / login.
 *
 * <p>Kept in Phase 0 so the context already carries the encoder bean and
 * BCrypt compatibility is verified early (demo passwords in V2 seeds
 * will be BCrypt hashes of student/faculty/admin).</p>
 */
@Configuration
public class PasswordConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }
}
