-- V5__course_outcomes.sql — faculty-authored "What you'll learn" outcomes.
-- Nullable JSON array of strings; existing rows simply show the UI fallback.
ALTER TABLE courses ADD COLUMN outcomes_json JSON NULL;
