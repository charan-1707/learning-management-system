package com.learnhub.lms.service.impl;

import com.learnhub.lms.dto.response.AttendanceHistoryResponse;
import com.learnhub.lms.dto.response.CourseAttendanceResponse;
import com.learnhub.lms.dto.response.GradeItemResponse;
import com.learnhub.lms.dto.response.StudentAttendanceResponse;
import com.learnhub.lms.entity.Attendance;
import com.learnhub.lms.entity.QuizAttempt;
import com.learnhub.lms.entity.Submission;
import com.learnhub.lms.enums.AttendanceStatus;
import com.learnhub.lms.enums.QuizAttemptStatus;
import com.learnhub.lms.enums.SubmissionStatus;
import com.learnhub.lms.repository.AttendanceRepository;
import com.learnhub.lms.repository.QuizAttemptRepository;
import com.learnhub.lms.repository.QuizQuestionRepository;
import com.learnhub.lms.repository.SubmissionRepository;
import com.learnhub.lms.service.StudentDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StudentDashboardServiceImpl implements StudentDashboardService {

    private final SubmissionRepository submissionRepository;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final AttendanceRepository attendanceRepository;

    @Override
    public List<GradeItemResponse> getGrades(Long studentId) {
        List<GradeItemResponse> grades = new ArrayList<>();

        submissionRepository.findByStudentId(studentId).stream()
                .filter(s -> s.getStatus() == SubmissionStatus.GRADED
                        && s.getScore() != null
                        && s.getGradedAt() != null)
                .forEach(s -> grades.add(new GradeItemResponse(
                        s.getAssignment().getId(),
                        s.getAssignment().getTitle(),
                        s.getAssignment().getCourse().getId(),
                        s.getAssignment().getCourse().getTitle(),
                        s.getScore(),
                        s.getAssignment().getMaxMarks(),
                        "assignment",
                        s.getGradedAt())));

        quizAttemptRepository.findByStudentId(studentId).stream()
                .filter(a -> a.getStatus() == QuizAttemptStatus.SUBMITTED
                        && a.getScore() != null
                        && a.getSubmittedAt() != null)
                .forEach(a -> {
                    BigDecimal max = quizQuestionRepository.findByQuizId(a.getQuiz().getId()).stream()
                            .map(q -> q.getMarks())
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    grades.add(new GradeItemResponse(
                            a.getQuiz().getId(),
                            a.getQuiz().getTitle(),
                            a.getQuiz().getCourse().getId(),
                            a.getQuiz().getCourse().getTitle(),
                            a.getScore(),
                            max,
                            "quiz",
                            a.getSubmittedAt()));
                });

        grades.sort(Comparator.comparing(GradeItemResponse::date).reversed());
        return grades;
    }

    @Override
    public StudentAttendanceResponse getAttendance(Long studentId) {
        List<Attendance> records = attendanceRepository.findByStudentId(studentId);

        long present = records.stream()
                .filter(r -> r.getStatus() == AttendanceStatus.PRESENT)
                .count();
        long total = records.size();
        int percent = total == 0 ? 0 : (int) Math.round(present * 100.0 / total);

        Map<Long, long[]> countsByCourse = new LinkedHashMap<>();
        Map<Long, String> namesByCourse = new LinkedHashMap<>();
        records.forEach(r -> {
            namesByCourse.putIfAbsent(r.getCourse().getId(), r.getCourse().getTitle());
            long[] counts = countsByCourse.computeIfAbsent(r.getCourse().getId(), id -> new long[2]);
            counts[1]++;
            if (r.getStatus() == AttendanceStatus.PRESENT) {
                counts[0]++;
            }
        });

        List<CourseAttendanceResponse> courseSummary = countsByCourse.entrySet().stream()
                .map(e -> {
                    long p = e.getValue()[0];
                    long t = e.getValue()[1];
                    int coursePercent = t == 0 ? 0 : (int) Math.round(p * 100.0 / t);
                    return new CourseAttendanceResponse(e.getKey(), namesByCourse.get(e.getKey()), p, t, coursePercent);
                })
                .sorted(Comparator.comparing(CourseAttendanceResponse::course))
                .toList();

        List<AttendanceHistoryResponse> history = records.stream()
                .sorted(Comparator.comparing(Attendance::getAttendanceDate).reversed())
                .map(r -> new AttendanceHistoryResponse(
                        r.getCourse().getId(),
                        r.getCourse().getTitle(),
                        r.getAttendanceDate(),
                        r.getStatus()))
                .toList();

        return new StudentAttendanceResponse(percent, present, total, countsByCourse.size(), courseSummary, history);
    }
}