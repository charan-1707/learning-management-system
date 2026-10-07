package com.learnhub.lms.enrollment;

import com.learnhub.lms.course.CourseDto;

/** GET /api/students/me/enrollments element: {enrollment, course} (matches frontend). */
public record EnrollmentWithCourse(EnrollmentDto enrollment, CourseDto course) {
}
