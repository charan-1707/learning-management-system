package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    @Modifying
    @Query("DELETE FROM Announcement a WHERE a.course.id IN :courseIds")
    void deleteByCourseIdsIn(@Param("courseIds") Collection<Long> courseIds);
}