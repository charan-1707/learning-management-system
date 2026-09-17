package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.QuizQuestionRequest;
import com.learnhub.lms.dto.request.QuizRequest;
import com.learnhub.lms.dto.response.QuizQuestionManagementResponse;
import com.learnhub.lms.dto.response.QuizQuestionResponse;
import com.learnhub.lms.dto.response.QuizResponse;
import com.learnhub.lms.entity.Course;
import com.learnhub.lms.entity.Quiz;
import com.learnhub.lms.entity.QuizAttempt;
import com.learnhub.lms.entity.QuizQuestion;
import com.learnhub.lms.exception.BusinessRuleException;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.CourseRepository;
import com.learnhub.lms.repository.QuizAnswerRepository;
import com.learnhub.lms.repository.QuizAttemptRepository;
import com.learnhub.lms.repository.QuizQuestionRepository;
import com.learnhub.lms.repository.QuizRepository;
import com.learnhub.lms.service.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class QuizServiceImpl implements QuizService {

    private final QuizRepository quizRepository;
    private final CourseRepository courseRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizAnswerRepository quizAnswerRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<QuizResponse> getQuizzesForCourse(Long courseId) {
        return mapper.toQuizResponses(quizRepository.findByCourseId(courseId));
    }

    @Override
    @Transactional(readOnly = true)
    public QuizResponse getQuizById(Long id) {
        return mapper.toQuizResponse(findOrThrow(id));
    }

    @Override
    public QuizResponse createQuiz(Long courseId, QuizRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", courseId));
        if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
            throw new BusinessRuleException("A quiz must contain at least one question.");
        }
        Quiz quiz = new Quiz();
        quiz.setCourse(course);
        applyRequest(quiz, request);
        Quiz saved = quizRepository.save(quiz);
        applyQuestions(saved, request.getQuestions());
        return mapper.toQuizResponse(saved);
    }

    @Override
    public QuizResponse updateQuiz(Long quizId, QuizRequest request) {
        Quiz quiz = findOrThrow(quizId);
        applyRequest(quiz, request);
        applyQuestions(quiz, request.getQuestions());
        return mapper.toQuizResponse(quizRepository.save(quiz));
    }

    @Override
    public void deleteQuiz(Long quizId) {
        Quiz quiz = findOrThrow(quizId);
        quizQuestionRepository.deleteAll(quizQuestionRepository.findByQuizId(quizId));
        List<QuizAttempt> attempts = quizAttemptRepository.findByQuizId(quizId);
        attempts.forEach(a -> quizAnswerRepository.deleteAll(quizAnswerRepository.findByAttemptId(a.getId())));
        quizAttemptRepository.deleteAll(attempts);
        quizRepository.delete(quiz);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizQuestionManagementResponse> getQuestionsForManagement(Long quizId) {
        return quizQuestionRepository.findByQuizIdOrderByDisplayOrderAsc(quizId).stream()
                .map(mapper::toQuizQuestionManagementResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizQuestionResponse> getQuestionsForAttempt(Long quizId) {
        Quiz quiz = findOrThrow(quizId);
        if (quiz.getStatus() != com.learnhub.lms.enums.QuizStatus.PUBLISHED) {
            throw new BusinessRuleException("Quiz is not published yet.");
        }
        return quizQuestionRepository.findByQuizIdOrderByDisplayOrderAsc(quizId).stream()
                .map(mapper::toQuizQuestionResponse)
                .toList();
    }

    private void applyRequest(Quiz quiz, QuizRequest request) {
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setDurationMinutes(request.getDurationMinutes());
        quiz.setMaxAttempts(request.getMaxAttempts());
        if (request.getStatus() != null) {
            quiz.setStatus(request.getStatus());
        }
    }

    private void applyQuestions(Quiz quiz, List<QuizQuestionRequest> questionRequests) {
        quizQuestionRepository.deleteAll(quizQuestionRepository.findByQuizId(quiz.getId()));
        if (questionRequests == null || questionRequests.isEmpty()) {
            return;
        }
        int order = 1;
        for (QuizQuestionRequest q : questionRequests) {
            QuizQuestion question = new QuizQuestion();
            question.setQuiz(quiz);
            question.setQuestionText(q.getQuestionText());
            question.setOptionA(q.getOptionA());
            question.setOptionB(q.getOptionB());
            question.setOptionC(q.getOptionC());
            question.setOptionD(q.getOptionD());
            question.setCorrectOption(q.getCorrectOption());
            question.setMarks(q.getMarks());
            question.setDisplayOrder(q.getDisplayOrder() != null ? q.getDisplayOrder() : order++);
            quizQuestionRepository.save(question);
        }
    }

    private Quiz findOrThrow(Long id) {
        return quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", id));
    }
}