package com.learnhub.lms.repository;

import com.learnhub.lms.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByQuizIdOrderByDisplayOrderAsc(Long quizId);

    List<QuizQuestion> findByQuizId(Long quizId);

    long countByQuizId(Long quizId);
}