package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {

    List<Quiz> findByCourseId(Long courseId);

    @Modifying
    @Query("DELETE FROM Quiz q WHERE q.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("DELETE FROM Quiz q WHERE q.id = :id")
    void deleteQuizById(@Param("id") Long id);
}