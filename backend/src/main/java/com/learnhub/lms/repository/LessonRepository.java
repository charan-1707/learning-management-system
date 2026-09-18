package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findByModuleIdOrderByDisplayOrderAsc(Long moduleId);

    List<Lesson> findByModuleId(Long moduleId);

    List<Lesson> findByModuleCourseId(Long courseId);

    List<Lesson> findByModuleIdIn(Collection<Long> moduleIds);

    long countByModuleId(Long moduleId);

    @Modifying
    @Query("DELETE FROM Lesson l WHERE l.module.id IN :moduleIds")
    void deleteByModuleIdsIn(@Param("moduleIds") Collection<Long> moduleIds);

    @Modifying
    @Query("DELETE FROM Lesson l WHERE l.id = :id")
    void deleteLessonById(@Param("id") Long id);
}