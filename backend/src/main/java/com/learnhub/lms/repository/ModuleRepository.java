package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Module;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ModuleRepository extends JpaRepository<Module, Long> {

    List<Module> findByCourseIdOrderByDisplayOrderAsc(Long courseId);

    List<Module> findByCourseId(Long courseId);

    @Modifying
    @Query("DELETE FROM Module m WHERE m.course.id = :courseId")
    void deleteByCourseId(@Param("courseId") Long courseId);

    @Modifying
    @Query("DELETE FROM Module m WHERE m.id = :id")
    void deleteModuleById(@Param("id") Long id);
}