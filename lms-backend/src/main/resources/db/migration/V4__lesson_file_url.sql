-- V4__lesson_file_url.sql — lesson materials can reference an uploaded file
-- (stored_files via POST /api/uploads) or an external URL (e.g. YouTube).
-- Nullable so all existing rows stay valid; no backfill needed.
ALTER TABLE lessons ADD COLUMN file_url VARCHAR(500) NULL AFTER size_bytes;
