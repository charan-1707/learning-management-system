package com.learnhub.lms.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

  List<QuizQuestion> findByQuiz_IdOrderByPositionAsc(String quizId);
}
