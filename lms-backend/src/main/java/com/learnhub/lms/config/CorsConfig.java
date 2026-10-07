package com.learnhub.lms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

/**
 * CORS for dev + frozen frontend.
 *
 * <p>Plan §13.4: allow {@code http://localhost:*}, {@code http://127.0.0.1:*},
 * and {@code file://} (browser sends {@code Origin: null} for file://).
 * Uses origin <em>patterns</em> because ports are wildcarded.
 * {@code Authorization} is exposed so the rewritten api/index.js can read it.</p>
 *
 * <p>Split hosting: extra origins from {@code app.cors.allowed-origins}
 * (env {@code APP_CORS_ALLOWED_ORIGINS}, comma-separated) are merged with the
 * dev defaults below, so the production frontend origin needs no code change.</p>
 */
@Configuration
public class CorsConfig {

  @Value("${app.cors.allowed-origins:}")
  private String extraOrigins;

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    List<String> patterns = new ArrayList<>(List.of(
        "http://localhost:*",
        "http://127.0.0.1:*",
        "http://192.168.*:*",
        "http://10.*:*",
        "https://*.trycloudflare.com",
        "null"));
    if (extraOrigins != null) {
      for (String o : extraOrigins.split(",")) {
        String t = o.trim();
        if (!t.isEmpty() && !patterns.contains(t)) {
          patterns.add(t);
        }
      }
    }
    cfg.setAllowedOriginPatterns(patterns);
    cfg.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("*"));
    cfg.setExposedHeaders(List.of("Authorization", "X-Total-Count"));
    cfg.setAllowCredentials(false);
    cfg.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", cfg);
    return source;
  }
}
