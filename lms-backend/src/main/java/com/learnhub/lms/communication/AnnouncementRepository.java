package com.learnhub.lms.communication;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AnnouncementRepository extends JpaRepository<Announcement, String> {

  List<Announcement> findByCourse_IdOrderByCreatedAtDesc(String courseId);
}
