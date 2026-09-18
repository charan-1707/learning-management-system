package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    List<Assignment> findByCourseId(Long courseId);

    @Modifying
    @Query("DELETE FROM Assignment a WHERE a.course.id IN :courseIds")
    void deleteByCourseIdsIn(@Param("courseIds") Collection<Long> courseIds);

    @Modifying
    @Query("DELETE FROM Assignment a WHERE a.id = :id")
    void deleteAssignmentById(@Param("id") Long id);
}