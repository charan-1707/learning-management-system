package com.learnhub.lms.service;

import com.learnhub.lms.dto.response.GradeItemResponse;
import com.learnhub.lms.dto.response.StudentAttendanceResponse;

import java.util.List;

public interface StudentDashboardService {

    List<GradeItemResponse> getGrades(Long studentId);

    StudentAttendanceResponse getAttendance(Long studentId);
}