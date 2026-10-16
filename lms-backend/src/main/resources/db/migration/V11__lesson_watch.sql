-- V11__lesson_watch.sql — engagement tracking for anti-gaming completion.
-- watch_pct holds the best video watch percentage seen (0-100, NULL until the
-- first heartbeat). created_at doubles as the dwell-clock start. Plain INT NULL
-- round-trips on both MySQL and H2.
ALTER TABLE lesson_progress ADD COLUMN watch_pct INT NULL;
