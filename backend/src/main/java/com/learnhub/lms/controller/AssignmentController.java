package com.learnhub.lms.controller;

import com.learnhub.lms.dto.request.AssignmentRequest;
import com.learnhub.lms.dto.response.AssignmentResponse;
import com.learnhub.lms.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AssignmentController {

    private final AssignmentService assignmentService;

    @GetMapping("/api/courses/{courseId}/assignments")
    public List<AssignmentResponse> getByCourse(@PathVariable Long courseId) {
        return assignmentService.getAssignmentsForCourse(courseId);
    }

    @GetMapping("/api/assignments/{id}")
    public AssignmentResponse getById(@PathVariable Long id) {
        return assignmentService.getAssignmentById(id);
    }

    @PostMapping("/api/courses/{courseId}/assignments")
    public ResponseEntity<AssignmentResponse> create(@PathVariable Long courseId,
                                                     @Valid @RequestBody AssignmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.createAssignment(courseId, request));
    }

    @PutMapping("/api/assignments/{id}")
    public AssignmentResponse update(@PathVariable Long id,
                                     @Valid @RequestBody AssignmentRequest request) {
        return assignmentService.updateAssignment(id, request);
    }

    @DeleteMapping("/api/assignments/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        assignmentService.deleteAssignment(id);
        return ResponseEntity.noContent().build();
    }
}