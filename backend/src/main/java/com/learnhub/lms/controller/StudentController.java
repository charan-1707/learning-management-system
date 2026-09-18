package com.learnhub.lms.controller;

import com.learnhub.lms.dto.response.CourseResponse;
import com.learnhub.lms.security.UserPrincipal;
import com.learnhub.lms.service.EnrollmentService;
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

    @GetMapping("/me/courses")
    public List<CourseResponse> getMyCourses(@AuthenticationPrincipal UserPrincipal principal) {
        return enrollmentService.getCoursesByStudent(principal.getId());
    }
}