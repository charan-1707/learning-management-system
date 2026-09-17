package com.learnhub.lms.controller;

import com.learnhub.lms.dto.request.EnrollmentRequest;
import com.learnhub.lms.dto.response.EnrollmentResponse;
import com.learnhub.lms.security.UserPrincipal;
import com.learnhub.lms.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    @PostMapping
    public ResponseEntity<EnrollmentResponse> enroll(@Valid @RequestBody EnrollmentRequest request,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            request.setStudentId(principal.getId());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(enrollmentService.enroll(request));
    }

    @GetMapping("/student/{studentId}")
    public List<EnrollmentResponse> getByStudent(@PathVariable Long studentId,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            studentId = principal.getId();
        }
        return enrollmentService.getEnrollmentsByStudent(studentId);
    }

    @GetMapping("/course/{courseId}")
    public List<EnrollmentResponse> getByCourse(@PathVariable Long courseId) {
        return enrollmentService.getEnrollmentsByCourse(courseId);
    }

    @GetMapping
    public EnrollmentResponse getEnrollment(@RequestParam Long studentId,
                                            @RequestParam Long courseId,
                                            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            studentId = principal.getId();
        }
        return enrollmentService.getEnrollment(studentId, courseId);
    }

    @GetMapping("/{studentId}/{courseId}/progress")
    public BigDecimal getProgress(@PathVariable Long studentId,
                                  @PathVariable Long courseId,
                                  @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            studentId = principal.getId();
        }
        return enrollmentService.getProgress(studentId, courseId);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEnrollment(@PathVariable Long id) {
        enrollmentService.deleteEnrollment(id);
        return ResponseEntity.noContent().build();
    }
}