package com.learnhub.lms.repository;

import com.learnhub.lms.entity.Attendance;
import com.learnhub.lms.entity.Course;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.enums.AttendanceStatus;
import com.learnhub.lms.enums.CourseStatus;
import com.learnhub.lms.enums.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest
class AttendanceRepositoryTest {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CourseRepository courseRepository;

    private User student;
    private Course course;

    @BeforeEach
    void setUp() {
        User faculty = new User();
        faculty.setName("Dr. Smith");
        faculty.setEmail("smith5@learnhub.com");
        faculty.setPassword("{bcrypt}hash");
        faculty.setRole(UserRole.FACULTY);
        userRepository.saveAndFlush(faculty);

        student = new User();
        student.setName("Alice");
        student.setEmail("alice5@learnhub.com");
        student.setPassword("{bcrypt}hash");
        student.setRole(UserRole.STUDENT);
        userRepository.saveAndFlush(student);

        course = new Course();
        course.setTitle("Operating Systems");
        course.setCode("OS505");
        course.setStatus(CourseStatus.PUBLISHED);
        course.setFaculty(faculty);
        courseRepository.saveAndFlush(course);
    }

    @Test
    void attendancePerCourseStudentDate_isUnique() {
        attendanceRepository.saveAndFlush(sampleAttendance(LocalDate.of(2026, 9, 1)));

        assertThatThrownBy(() ->
                attendanceRepository.saveAndFlush(sampleAttendance(LocalDate.of(2026, 9, 1))))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void sameStudentDifferentDate_isAllowed() {
        attendanceRepository.saveAndFlush(sampleAttendance(LocalDate.of(2026, 9, 1)));
        attendanceRepository.saveAndFlush(sampleAttendance(LocalDate.of(2026, 9, 2)));

        assertThat(attendanceRepository.findByStudentId(student.getId())).hasSize(2);
    }

    @Test
    void findMethods_scopeByCourseAndStudent() {
        attendanceRepository.saveAndFlush(sampleAttendance(LocalDate.of(2026, 9, 1)));

        assertThat(attendanceRepository.findByCourseId(course.getId())).hasSize(1);
        assertThat(attendanceRepository.findByCourseIdAndStudentId(course.getId(), student.getId())).hasSize(1);
        assertThat(attendanceRepository
                .existsByCourseIdAndStudentIdAndAttendanceDate(course.getId(), student.getId(),
                        LocalDate.of(2026, 9, 1))).isTrue();
    }

    private Attendance sampleAttendance(LocalDate date) {
        Attendance attendance = new Attendance();
        attendance.setCourse(course);
        attendance.setStudent(student);
        attendance.setAttendanceDate(date);
        attendance.setStatus(AttendanceStatus.PRESENT);
        return attendance;
    }
}