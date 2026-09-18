package com.learnhub.lms.controller;

import com.learnhub.lms.dto.response.CourseResponse;
import com.learnhub.lms.security.UserPrincipal;
import com.learnhub.lms.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Self-service endpoints for the authenticated instructor (faculty).
 */
@RestController
@RequestMapping("/api/instructors")
@RequiredArgsConstructor
public class InstructorController {

    private final CourseService courseService;

    @GetMapping("/me/courses")
    public List<CourseResponse> getMyCourses(@AuthenticationPrincipal UserPrincipal principal) {
        return courseService.getCoursesByFaculty(principal.getId());
    }
}