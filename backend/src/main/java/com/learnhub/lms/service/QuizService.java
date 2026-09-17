package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.QuizRequest;
import com.learnhub.lms.dto.response.QuizQuestionManagementResponse;
import com.learnhub.lms.dto.response.QuizQuestionResponse;
import com.learnhub.lms.dto.response.QuizResponse;

import java.util.List;

public interface QuizService {

    List<QuizResponse> getQuizzesForCourse(Long courseId);

    QuizResponse getQuizById(Long id);

    QuizResponse createQuiz(Long courseId, QuizRequest request);

    QuizResponse updateQuiz(Long quizId, QuizRequest request);

    void deleteQuiz(Long quizId);

    List<QuizQuestionManagementResponse> getQuestionsForManagement(Long quizId);

    List<QuizQuestionResponse> getQuestionsForAttempt(Long quizId);
}