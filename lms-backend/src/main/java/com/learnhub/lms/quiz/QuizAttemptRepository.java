package com.learnhub.lms.quiz;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

  List<QuizAttempt> findByQuiz_IdAndStudent_IdOrderBySubmittedAtDesc(String quizId, Long studentId);

  List<QuizAttempt> findByQuiz_IdOrderBySubmittedAtDesc(String quizId);

  long countByQuiz_IdAndStudent_Id(String quizId, Long studentId);

  long countByQuiz_Id(String quizId);
}
