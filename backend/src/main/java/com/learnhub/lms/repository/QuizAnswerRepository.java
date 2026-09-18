package com.learnhub.lms.repository;

import com.learnhub.lms.entity.QuizAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {

    List<QuizAnswer> findByAttemptId(Long attemptId);

    @Modifying
    @Query("DELETE FROM QuizAnswer a WHERE a.attempt.id IN :attemptIds")
    void deleteByAttemptIdsIn(@Param("attemptIds") Collection<Long> attemptIds);
}