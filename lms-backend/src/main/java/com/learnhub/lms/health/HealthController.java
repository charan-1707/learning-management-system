package com.learnhub.lms.health;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Phase 0 smoke endpoint: {@code GET /api/health → {ok:true}}.
 */
@RestController
@RequestMapping("/api/health")
@Tag(name = "health", description = "Phase 0 bootstrap probe")
public class HealthController {

  @GetMapping
  @Operation(summary = "Liveness probe, public (no JWT)")
  public Map<String, Object> health() {
    return Map.of("ok", true);
  }
}
