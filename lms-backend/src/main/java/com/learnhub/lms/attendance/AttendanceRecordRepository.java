package com.learnhub.lms.attendance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

  List<AttendanceRecord> findByStudent_Id(Long studentId);

  List<AttendanceRecord> findBySession_Id(Long sessionId);

  Optional<AttendanceRecord> findBySession_IdAndStudent_Id(Long sessionId, Long studentId);
}
