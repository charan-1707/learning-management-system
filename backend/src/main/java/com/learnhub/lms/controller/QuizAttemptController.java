package com.learnhub.lms.controller;

import com.learnhub.lms.dto.request.QuizAttemptStartRequest;
import com.learnhub.lms.dto.request.QuizSubmitRequest;
import com.learnhub.lms.dto.response.QuizAttemptResponse;
import com.learnhub.lms.dto.response.QuizSubmissionResult;
import com.learnhub.lms.security.UserPrincipal;
import com.learnhub.lms.service.QuizAttemptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class QuizAttemptController {

    private final QuizAttemptService quizAttemptService;

    @PostMapping("/api/quizzes/{quizId}/attempts")
    public ResponseEntity<QuizAttemptResponse> startAttempt(@PathVariable Long quizId,
                                                            @Valid @RequestBody QuizAttemptStartRequest request,
                                                            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            request.setStudentId(principal.getId());
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(quizAttemptService.startAttempt(quizId, request));
    }

    @PostMapping("/api/attempts/{attemptId}/submit")
    public QuizSubmissionResult submitAttempt(@PathVariable Long attemptId,
                                              @Valid @RequestBody QuizSubmitRequest request,
                                              @AuthenticationPrincipal UserPrincipal principal) {
        return quizAttemptService.submitAttempt(attemptId, request, principal.getId());
    }

    @GetMapping("/api/quizzes/{quizId}/attempts")
    public List<QuizAttemptResponse> getAttempts(@PathVariable Long quizId,
                                                 @RequestParam(required = false) Long studentId,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent() || studentId == null) {
            return quizAttemptService.getAttemptsByQuizAndStudent(quizId, principal.getId());
        }
        return quizAttemptService.getAttemptsByQuizAndStudent(quizId, studentId);
    }
}