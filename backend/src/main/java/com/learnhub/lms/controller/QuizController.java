package com.learnhub.lms.controller;

import com.learnhub.lms.dto.request.QuizRequest;
import com.learnhub.lms.dto.response.QuizQuestionManagementResponse;
import com.learnhub.lms.dto.response.QuizQuestionResponse;
import com.learnhub.lms.dto.response.QuizResponse;
import com.learnhub.lms.service.QuizService;
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
public class QuizController {

    private final QuizService quizService;

    @GetMapping("/api/courses/{courseId}/quizzes")
    public List<QuizResponse> getByCourse(@PathVariable Long courseId) {
        return quizService.getQuizzesForCourse(courseId);
    }

    @GetMapping("/api/quizzes/{id}")
    public QuizResponse getById(@PathVariable Long id) {
        return quizService.getQuizById(id);
    }

    @PostMapping("/api/courses/{courseId}/quizzes")
    public ResponseEntity<QuizResponse> create(@PathVariable Long courseId,
                                               @Valid @RequestBody QuizRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.createQuiz(courseId, request));
    }

    @PutMapping("/api/quizzes/{id}")
    public QuizResponse update(@PathVariable Long id, @Valid @RequestBody QuizRequest request) {
        return quizService.updateQuiz(id, request);
    }

    @DeleteMapping("/api/quizzes/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/quizzes/{id}/questions")
    public List<QuizQuestionManagementResponse> getQuestionsManagement(@PathVariable Long id) {
        return quizService.getQuestionsForManagement(id);
    }

    @GetMapping("/api/quizzes/{id}/questions/attempt")
    public List<QuizQuestionResponse> getQuestionsForAttempt(@PathVariable Long id) {
        return quizService.getQuestionsForAttempt(id);
    }
}