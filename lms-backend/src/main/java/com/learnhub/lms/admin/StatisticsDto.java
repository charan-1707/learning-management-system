package com.learnhub.lms.admin;

/** GET /api/admin/statistics — live counts (plan §12). */
public record StatisticsDto(long totalCourses, long publishedCourses, long totalStudents,
    long totalFaculty, long totalUsers, long enrollments, long submissions,
    long submissionsToday, long activeUsers) {
}
