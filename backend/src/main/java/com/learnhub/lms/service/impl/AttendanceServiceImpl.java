package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.request.AttendanceRequest;
import com.learnhub.lms.dto.response.AttendanceResponse;
import com.learnhub.lms.entity.Attendance;
import com.learnhub.lms.entity.Course;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.exception.ResourceNotFoundException;
import com.learnhub.lms.mapper.EntityMapper;
import com.learnhub.lms.repository.AttendanceRepository;
import com.learnhub.lms.repository.CourseRepository;
import com.learnhub.lms.repository.UserRepository;
import com.learnhub.lms.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceServiceImpl implements AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EntityMapper mapper;

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceForCourse(Long courseId) {
        return mapper.toAttendanceResponses(attendanceRepository.findByCourseId(courseId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getAttendanceForStudent(Long studentId) {
        return mapper.toAttendanceResponses(attendanceRepository.findByStudentId(studentId));
    }

    @Override
    public AttendanceResponse markAttendance(AttendanceRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", request.getCourseId()));
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("User", request.getStudentId()));

        Attendance attendance = attendanceRepository
                .findByCourseIdAndStudentIdAndAttendanceDate(
                        request.getCourseId(), request.getStudentId(), request.getAttendanceDate());
        if (attendance == null) {
            attendance = new Attendance();
            attendance.setCourse(course);
            attendance.setStudent(student);
            attendance.setAttendanceDate(request.getAttendanceDate());
        }
        attendance.setStatus(request.getStatus());
        if (request.getMarkedBy() != null) {
            User marker = userRepository.findById(request.getMarkedBy())
                    .orElseThrow(() -> new ResourceNotFoundException("User", request.getMarkedBy()));
            attendance.setMarkedBy(marker);
        }
        return mapper.toAttendanceResponse(attendanceRepository.save(attendance));
    }
}