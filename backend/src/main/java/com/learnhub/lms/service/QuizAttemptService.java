package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.QuizAttemptStartRequest;
import com.learnhub.lms.dto.request.QuizSubmitRequest;
import com.learnhub.lms.dto.response.QuizAttemptResponse;
import com.learnhub.lms.dto.response.QuizSubmissionResult;

import java.util.List;

public interface QuizAttemptService {

    QuizAttemptResponse startAttempt(Long quizId, QuizAttemptStartRequest request);

    /**
     * Submits an attempt. {@code currentUserId} is the authenticated caller:
     * students may only submit their own attempts, faculty/admin may submit on
     * behalf of any student. Pass {@code null} to skip the ownership check.
     */
    QuizSubmissionResult submitAttempt(Long attemptId, QuizSubmitRequest request, Long currentUserId);

    List<QuizAttemptResponse> getAttemptsByQuizAndStudent(Long quizId, Long studentId);
}