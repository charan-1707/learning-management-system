-- V6__course_thumbnail.sql — optional cover image for course cards.
-- Nullable so all existing rows stay valid.
ALTER TABLE courses ADD COLUMN thumbnail_url VARCHAR(500) NULL;
