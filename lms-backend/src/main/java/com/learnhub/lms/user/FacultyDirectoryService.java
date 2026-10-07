package com.learnhub.lms.user;

import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Derives {@link FacultyRow}s live (plan §7): courses owned + distinct learners. */
@Service
public class FacultyDirectoryService {

  private final CourseRepository courses;
  private final EnrollmentRepository enrollments;

  public FacultyDirectoryService(CourseRepository courses, EnrollmentRepository enrollments) {
    this.courses = courses;
    this.enrollments = enrollments;
  }

  @Transactional(readOnly = true)
  public FacultyRow row(User u) {
    return new FacultyRow(u.getId(), u.getName(), u.getEmail(), u.getDept(), u.getTitle(),
        courses.countByInstructor_Id(u.getId()),
        enrollments.countDistinctStudentsByInstructor(u.getId()),
        u.getStatus() == null ? null : u.getStatus().dbValue, u.getJoinedLabel());
  }
}
