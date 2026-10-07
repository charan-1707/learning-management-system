package com.learnhub.lms.user;

/**
 * Admin student-directory row (replaces the static {@code M.studentList} slice).
 * {@code courses} = enrollment count, {@code attendance} = present/total % from
 * records (null when no sessions), {@code gpa} = 10-scale average (null when
 * ungraded) — all derived live per plan §7.
 */
public record StudentRow(Long id, String name, String email, String program, String year,
    int courses, Integer attendance, Double gpa, String status, String joined) {
}
