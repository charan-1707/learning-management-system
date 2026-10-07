package com.learnhub.lms.user;

/**
 * Admin faculty-directory row (replaces {@code M.facultyList}). Counts are
 * derived live: courses owned + distinct learners across them.
 */
public record FacultyRow(Long id, String name, String email, String dept, String title,
    long coursesTaught, long students, String status, String joined) {
}
