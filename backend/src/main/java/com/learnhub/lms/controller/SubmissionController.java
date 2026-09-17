package com.learnhub.lms.controller;

import com.learnhub.lms.dto.request.GradeRequest;
import com.learnhub.lms.dto.request.SubmissionRequest;
import com.learnhub.lms.dto.response.SubmissionResponse;
import com.learnhub.lms.security.UserPrincipal;
import com.learnhub.lms.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    @GetMapping("/api/assignments/{assignmentId}/submissions")
    public List<SubmissionResponse> getByAssignment(@PathVariable Long assignmentId) {
        return submissionService.getSubmissionsForAssignment(assignmentId);
    }

    @GetMapping("/api/submissions/student/{studentId}")
    public List<SubmissionResponse> getByStudent(@PathVariable Long studentId,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            studentId = principal.getId();
        }
        return submissionService.getSubmissionsByStudent(studentId);
    }

    @GetMapping("/api/submissions")
    public SubmissionResponse getSubmission(@RequestParam Long assignmentId,
                                            @RequestParam Long studentId,
                                            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            studentId = principal.getId();
        }
        return submissionService.getSubmission(assignmentId, studentId);
    }

    @PostMapping("/api/submissions")
    public ResponseEntity<SubmissionResponse> submit(@Valid @RequestBody SubmissionRequest request,
                                                     @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            request.setStudentId(principal.getId());
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(submissionService.submit(request));
    }

    @PatchMapping("/api/submissions/{id}/grade")
    public SubmissionResponse grade(@PathVariable Long id,
                                    @RequestParam(required = false) Long gradedBy,
                                    @Valid @RequestBody GradeRequest request,
                                    @AuthenticationPrincipal UserPrincipal principal) {
        if (gradedBy == null) {
            gradedBy = principal.getId();
        }
        return submissionService.grade(id, request, gradedBy);
    }
}