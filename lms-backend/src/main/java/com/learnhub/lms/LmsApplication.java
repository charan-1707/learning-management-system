package com.learnhub.lms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.learnhub.lms.config.JwtProps;

/**
 * LearnHub LMS backend entry point.
 *
 * <p>Phase 0: boots the Spring context, runs Flyway migrations against
 * MySQL {@code learnhub}, and exposes {@code GET /api/health} + Swagger UI.
 * Full domain plan: BACKEND_IMPLEMENTATION_PLAN.md §3–§5.</p>
 */
@SpringBootApplication
@EnableConfigurationProperties(JwtProps.class)
public class LmsApplication {

  public static void main(String[] args) {
    SpringApplication.run(LmsApplication.class, args);
  }
}
