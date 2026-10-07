package com.learnhub.lms.attendance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {

  List<AttendanceSession> findByCourse_IdOrderBySessionDateDesc(String courseId);

  Optional<AttendanceSession> findByCourse_IdAndSessionDate(String courseId, LocalDate date);
}
