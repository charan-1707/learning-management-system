package com.learnhub.lms.repository;

import com.learnhub.lms.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByQuizIdOrderByDisplayOrderAsc(Long quizId);

    List<QuizQuestion> findByQuizId(Long quizId);

    long countByQuizId(Long quizId);

    @Modifying
    @Query("DELETE FROM QuizQuestion q WHERE q.quiz.id IN :quizIds")
    void deleteByQuizIdsIn(@Param("quizIds") Collection<Long> quizIds);
}