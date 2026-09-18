package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    List<Attendance> findByCourseId(Long courseId);

    List<Attendance> findByStudentId(Long studentId);

    List<Attendance> findByCourseIdAndStudentId(Long courseId, Long studentId);

    boolean existsByCourseIdAndStudentIdAndAttendanceDate(Long courseId, Long studentId, LocalDate attendanceDate);

    Attendance findByCourseIdAndStudentIdAndAttendanceDate(Long courseId, Long studentId, LocalDate attendanceDate);

    @Modifying
    @Query("DELETE FROM Attendance a WHERE a.course.id IN :courseIds")
    void deleteByCourseIdsIn(@Param("courseIds") Collection<Long> courseIds);
}