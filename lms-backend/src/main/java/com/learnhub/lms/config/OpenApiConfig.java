package com.learnhub.lms.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Swagger / OpenAPI metadata. Phase 0 acceptance requires Swagger UI
 * to load at {@code /swagger-ui.html}.
 */
@Configuration
public class OpenApiConfig {

  @Bean
  public OpenAPI learnHubOpenApi() {
    return new OpenAPI().info(new Info()
        .title("LearnHub LMS API")
        .version("0.0.1-phase0")
        .description("Backend for the frozen vanilla-JS frontend. "
            + "Spec: lms-frontend/report2.md §9. Plan: BACKEND_IMPLEMENTATION_PLAN.md."));
  }
}
