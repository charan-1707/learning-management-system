package com.learnhub.lms.controller;

import com.learnhub.lms.dto.request.AttendanceRequest;
import com.learnhub.lms.dto.response.AttendanceResponse;
import com.learnhub.lms.security.UserPrincipal;
import com.learnhub.lms.service.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/api/courses/{courseId}/attendance")
    public List<AttendanceResponse> getForCourse(@PathVariable Long courseId) {
        return attendanceService.getAttendanceForCourse(courseId);
    }

    @GetMapping("/api/students/{studentId}/attendance")
    public List<AttendanceResponse> getForStudent(@PathVariable Long studentId,
                                                  @AuthenticationPrincipal UserPrincipal principal) {
        if (principal.isStudent()) {
            studentId = principal.getId();
        }
        return attendanceService.getAttendanceForStudent(studentId);
    }

    @PostMapping("/api/attendance")
    public ResponseEntity<AttendanceResponse> mark(@Valid @RequestBody AttendanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.markAttendance(request));
    }
}