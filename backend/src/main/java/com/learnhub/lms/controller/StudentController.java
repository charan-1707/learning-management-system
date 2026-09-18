package com.learnhub.lms.controller;

import com.learnhub.lms.dto.response.CourseResponse;
import com.learnhub.lms.dto.response.GradeItemResponse;
import com.learnhub.lms.dto.response.StudentAttendanceResponse;
import com.learnhub.lms.security.UserPrincipal;
import com.learnhub.lms.service.EnrollmentService;
import com.learnhub.lms.service.StudentDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Self-service endpoints for the authenticated student.
 */
@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final EnrollmentService enrollmentService;
    private final StudentDashboardService studentDashboardService;

    @GetMapping("/me/courses")
    public List<CourseResponse> getMyCourses(@AuthenticationPrincipal UserPrincipal principal) {
        return enrollmentService.getCoursesByStudent(principal.getId());
    }

    @GetMapping("/me/grades")
    public List<GradeItemResponse> getMyGrades(@AuthenticationPrincipal UserPrincipal principal) {
        return studentDashboardService.getGrades(principal.getId());
    }

    @GetMapping("/me/attendance")
    public StudentAttendanceResponse getMyAttendance(@AuthenticationPrincipal UserPrincipal principal) {
        return studentDashboardService.getAttendance(principal.getId());
    }
}