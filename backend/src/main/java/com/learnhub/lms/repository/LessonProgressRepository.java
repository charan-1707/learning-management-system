package com.learnhub.lms.repository;

import com.learnhub.lms.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    List<LessonProgress> findByStudentId(Long studentId);

    List<LessonProgress> findByLessonId(Long lessonId);

    List<LessonProgress> findByStudentIdAndLessonModuleCourseId(Long studentId, Long courseId);

    List<LessonProgress> findByLessonIdIn(Collection<Long> lessonIds);
}