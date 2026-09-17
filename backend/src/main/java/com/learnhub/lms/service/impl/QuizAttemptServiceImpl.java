package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.QuizAnswerRequest;
import com.learnhub.lms.dto.request.QuizAttemptStartRequest;
import com.learnhub.lms.dto.request.QuizSubmitRequest;
import com.learnhub.lms.dto.response.QuizAnswerResponse;
import com.learnhub.lms.dto.response.QuizAttemptResponse;
import com.learnhub.lms.dto.response.QuizSubmissionResult;
import com.learnhub.lms.entity.Quiz;
import com.learnhub.lms.entity.QuizAnswer;
import com.learnhub.lms.entity.QuizAttempt;
import com.learnhub.lms.entity.QuizQuestion;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.QuizAttemptStatus;
import com.learnhub.lms.enums.UserRole;
import com.learnhub.lms.exception.BusinessRuleException;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.QuizAttemptRepository;
import com.learnhub.lms.repository.QuizQuestionRepository;
import com.learnhub.lms.repository.QuizRepository;
import com.learnhub.lms.repository.UserRepository;
import com.learnhub.lms.service.QuizAttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class QuizAttemptServiceImpl implements QuizAttemptService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final UserRepository userRepository;
    private final EntityMapper mapper;

    @Override
    public QuizAttemptResponse startAttempt(Long quizId, QuizAttemptStartRequest request) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", quizId));
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getStudentId()));
        if (student.getRole() != UserRole.STUDENT) {
            throw new BusinessRuleException("Only students can attempt quizzes.");
        }
        if (quiz.getStatus() != com.learnhub.lms.enums.QuizStatus.PUBLISHED) {
            throw new BusinessRuleException("Quiz is not published yet.");
        }
        if (hasOpenAttempt(quizId, request.getStudentId())) {
            throw new BusinessRuleException("You already have an in-progress attempt.");
        }
        long usedAttempts = countCompletedAttempts(quizId, request.getStudentId());
        if (usedAttempts >= quiz.getMaxAttempts()) {
            throw new BusinessRuleException("Maximum number of attempts reached.");
        }

        QuizAttempt attempt = new QuizAttempt();
        attempt.setQuiz(quiz);
        attempt.setStudent(student);
        attempt.setStatus(QuizAttemptStatus.IN_PROGRESS);
        return mapper.toQuizAttemptResponse(quizAttemptRepository.save(attempt));
    }

    @Override
    public QuizSubmissionResult submitAttempt(Long attemptId, QuizSubmitRequest request, Long currentUserId) {
        QuizAttempt attempt = quizAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("QuizAttempt", attemptId));
        if (currentUserId != null && !attempt.getStudent().getId().equals(currentUserId)) {
            throw new BusinessRuleException("This attempt belongs to another student.");
        }
        if (attempt.getStatus() == QuizAttemptStatus.SUBMITTED) {
            throw new BusinessRuleException("This attempt has already been submitted.");
        }

        Map<Long, QuizQuestion> questionsById = quizQuestionRepository
                .findByQuizId(attempt.getQuiz().getId()).stream()
                .collect(Collectors.toMap(QuizQuestion::getId, Function.identity()));

        List<QuizAnswer> answers = new ArrayList<>();
        BigDecimal totalScore = BigDecimal.ZERO;
        long correct = 0;
        for (QuizAnswerRequest answerReq : request.getAnswers()) {
            QuizQuestion question = questionsById.get(answerReq.getQuestionId());
            if (question == null) {
                throw new BusinessRuleException("Question " + answerReq.getQuestionId()
                        + " does not belong to this quiz.");
            }
            boolean isCorrect = question.getCorrectOption().equalsIgnoreCase(
                    answerReq.getSelectedOption() == null ? "" : answerReq.getSelectedOption());
            BigDecimal marksObtained = isCorrect ? question.getMarks() : BigDecimal.ZERO;
            if (isCorrect) {
                correct++;
                totalScore = totalScore.add(marksObtained);
            }
            QuizAnswer answer = new QuizAnswer();
            answer.setAttempt(attempt);
            answer.setQuestion(question);
            answer.setSelectedOption(answerReq.getSelectedOption());
            answer.setCorrect(isCorrect);
            answer.setMarksObtained(marksObtained);
            answers.add(answer);
        }

        attempt.getAnswers().clear();
        attempt.getAnswers().addAll(answers);
        attempt.setScore(totalScore.setScale(2, RoundingMode.HALF_UP));
        attempt.setStatus(QuizAttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());
        QuizAttempt saved = quizAttemptRepository.save(attempt);

        List<QuizAnswerResponse> answerResponses = saved.getAnswers().stream()
                .map(mapper::toQuizAnswerResponse)
                .toList();
        return new QuizSubmissionResult(
                saved.getId(),
                saved.getQuiz().getId(),
                saved.getScore(),
                questionsById.size(),
                correct,
                answerResponses);
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizAttemptResponse> getAttemptsByQuizAndStudent(Long quizId, Long studentId) {
        return mapper.toQuizAttemptResponses(
                quizAttemptRepository.findByQuizIdAndStudentId(quizId, studentId));
    }

    private boolean hasOpenAttempt(Long quizId, Long studentId) {
        return quizAttemptRepository.findByQuizIdAndStudentId(quizId, studentId).stream()
                .anyMatch(a -> a.getStatus() == QuizAttemptStatus.IN_PROGRESS);
    }

    private long countCompletedAttempts(Long quizId, Long studentId) {
        return quizAttemptRepository.findByQuizIdAndStudentId(quizId, studentId).stream()
                .filter(a -> a.getStatus() == QuizAttemptStatus.SUBMITTED)
                .count();
    }
}