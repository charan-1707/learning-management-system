package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.AttendanceRequest;
import com.learnhub.lms.dto.response.AttendanceResponse;

import java.util.List;

public interface AttendanceService {

    List<AttendanceResponse> getAttendanceForCourse(Long courseId);

    List<AttendanceResponse> getAttendanceForStudent(Long studentId);

    AttendanceResponse markAttendance(AttendanceRequest request);
}