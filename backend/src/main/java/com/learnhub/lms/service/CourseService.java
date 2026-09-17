package com.learnhub.lms.service;

import com.learnhub.lms.dto.request.CourseRequest;
import com.learnhub.lms.dto.response.CourseResponse;
import com.learnhub.lms.enums.CourseStatus;

import java.util.List;

public interface CourseService {

    CourseResponse createCourse(CourseRequest request);

    List<CourseResponse> getAllCourses();

    List<CourseResponse> getPublishedCourses();

    List<CourseResponse> getCoursesByFaculty(Long facultyId);

    List<CourseResponse> getCoursesByStatus(CourseStatus status);

    CourseResponse getCourseById(Long id);

    CourseResponse updateCourse(Long id, CourseRequest request);

    CourseResponse setCourseStatus(Long id, CourseStatus status);

    void deleteCourse(Long id);
}