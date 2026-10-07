package com.learnhub.lms.config;

import com.learnhub.lms.security.JwtAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Stateless JWT security. Phase 0: only health + docs + login are public.
 *
 * <p>Phase 2 adds method-security usage ({@code @PreAuthorize}) + the
 * {@code Authz} ownership helper; the URL rules below stay as the outer gate.</p>
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  private final JwtAuthFilter jwtAuthFilter;

  public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
    this.jwtAuthFilter = jwtAuthFilter;
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> {
        })
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/health", "/actuator/health").permitAll()
            // Public auth endpoints only; /api/auth/me stays behind the JWT.
            .requestMatchers(HttpMethod.POST, "/api/auth/login", "/api/auth/logout",
                "/api/auth/register", "/api/auth/verify-otp", "/api/auth/resend-otp",
                "/api/auth/forgot-password", "/api/auth/reset-password",
                "/api/auth/refresh")
            .permitAll()
            .requestMatchers(
                "/swagger-ui.html",
                "/swagger-ui/**",
                "/v3/api-docs",
                "/v3/api-docs/**")
            .permitAll()
            .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
            .requestMatchers("/api/**").authenticated()
            .anyRequest().permitAll())
        .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
        .exceptionHandling(ex -> ex
            .authenticationEntryPoint((req, res, e) -> {
              res.setStatus(401);
              res.setContentType("application/json");
              res.getWriter().write("{\"ok\":false,\"error\":\"Unauthorized\"}");
            })
            .accessDeniedHandler((req, res, e) -> {
              res.setStatus(403);
              res.setContentType("application/json");
              res.getWriter().write("{\"ok\":false,\"error\":\"Forbidden\"}");
            }));
    return http.build();
  }
}
