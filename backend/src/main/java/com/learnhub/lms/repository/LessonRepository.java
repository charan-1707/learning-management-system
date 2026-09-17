package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findByModuleIdOrderByDisplayOrderAsc(Long moduleId);

    List<Lesson> findByModuleId(Long moduleId);

    List<Lesson> findByModuleCourseId(Long courseId);

    List<Lesson> findByModuleIdIn(Collection<Long> moduleIds);

    long countByModuleId(Long moduleId);
}