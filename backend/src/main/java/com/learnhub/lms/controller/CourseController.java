package com.learnhub.lms.controller;

import com.learnhub.lms.dto.request.CourseRequest;
import com.learnhub.lms.dto.request.CourseStatusUpdateRequest;
import com.learnhub.lms.dto.response.CourseResponse;
import com.learnhub.lms.dto.response.EnrollmentCheckResponse;
import com.learnhub.lms.dto.response.EnrollmentResponse;
import com.learnhub.lms.enums.CourseStatus;
import com.learnhub.lms.security.UserPrincipal;
import com.learnhub.lms.service.CourseService;
import com.learnhub.lms.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final EnrollmentService enrollmentService;

    @GetMapping
    public List<CourseResponse> getAllCourses() {
        return courseService.getAllCourses();
    }

    @GetMapping("/published")
    public List<CourseResponse> getPublishedCourses() {
        return courseService.getPublishedCourses();
    }

    @GetMapping("/faculty/{facultyId}")
    public List<CourseResponse> getCoursesByFaculty(@PathVariable Long facultyId) {
        return courseService.getCoursesByFaculty(facultyId);
    }

    @GetMapping("/status/{status}")
    public List<CourseResponse> getCoursesByStatus(@PathVariable CourseStatus status) {
        return courseService.getCoursesByStatus(status);
    }

    @GetMapping("/{id}")
    public CourseResponse getCourse(@PathVariable Long id) {
        return courseService.getCourseById(id);
    }

    @PostMapping
    public ResponseEntity<CourseResponse> createCourse(@Valid @RequestBody CourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.createCourse(request));
    }

    @PutMapping("/{id}")
    public CourseResponse updateCourse(@PathVariable Long id, @Valid @RequestBody CourseRequest request) {
        return courseService.updateCourse(id, request);
    }

    @PatchMapping("/{id}/status")
    public CourseResponse updateStatus(@PathVariable Long id,
                                       @Valid @RequestBody CourseStatusUpdateRequest request) {
        return courseService.setCourseStatus(id, request.status());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.noContent().build();
    }

    // ---- Enrollment endpoints (students only) ----

    @PostMapping("/{courseId}/enroll")
    public ResponseEntity<EnrollmentResponse> enroll(@PathVariable Long courseId,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(enrollmentService.enroll(principal.getId(), courseId));
    }

    @DeleteMapping("/{courseId}/enroll")
    public ResponseEntity<Void> unenroll(@PathVariable Long courseId,
                                         @AuthenticationPrincipal UserPrincipal principal) {
        enrollmentService.unenroll(principal.getId(), courseId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{courseId}/enrollment")
    public EnrollmentCheckResponse checkEnrollment(@PathVariable Long courseId,
                                                   @AuthenticationPrincipal UserPrincipal principal) {
        return new EnrollmentCheckResponse(enrollmentService.isEnrolled(principal.getId(), courseId));
    }
}