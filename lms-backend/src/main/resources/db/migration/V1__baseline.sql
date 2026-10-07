-- V1__baseline.sql — Phase 0 Flyway baseline (intentionally empty of domain tables).
-- Proves Flyway wiring against MySQL before Phase 1 builds the full schema.
-- Phase 1 replaces domain DDL with the normative column list (plan §6.1).

CREATE TABLE IF NOT EXISTS flyway_baseline_probe (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
