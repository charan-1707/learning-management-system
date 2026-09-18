package com.learnhub.lms.dto.response;

/**
 * Aggregated platform statistics for the admin dashboard.
 */
public record AdminDashboardResponse(
        long totalUsers,
        long totalStudents,
        long totalFaculty,
        long totalCourses,
        long publishedCourses,
        long enrollments,
        long submissions,
        long submissionsToday,
        long activeUsers
) {
}