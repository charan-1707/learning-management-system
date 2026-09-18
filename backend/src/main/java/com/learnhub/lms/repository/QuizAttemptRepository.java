package com.learnhub.lms.repository;

import com.learnhub.lms.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {

    List<QuizAttempt> findByQuizId(Long quizId);

    List<QuizAttempt> findByQuizIdAndStudentId(Long quizId, Long studentId);

    List<QuizAttempt> findByStudentId(Long studentId);

    long countByQuizIdAndStudentId(Long quizId, Long studentId);

    @Modifying
    @Query("DELETE FROM QuizAttempt a WHERE a.quiz.id IN :quizIds")
    void deleteByQuizIdsIn(@Param("quizIds") Collection<Long> quizIds);
}