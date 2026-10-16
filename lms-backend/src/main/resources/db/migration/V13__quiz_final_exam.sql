-- V13__quiz_final_exam.sql — final-test marker for the course completion exam.
-- One final per course is enforced in QuizService (not by constraint, so a
-- faculty member can unmark/remark without migration surgery). Plain BOOLEAN
-- round-trips on both MySQL and H2.
ALTER TABLE quizzes ADD COLUMN final_exam BOOLEAN NOT NULL DEFAULT FALSE;
