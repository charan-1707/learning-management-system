package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Announcement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findByCourseIdOrderByCreatedAtDesc(Long courseId);
}