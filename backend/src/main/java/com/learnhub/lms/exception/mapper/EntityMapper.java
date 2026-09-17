package com.learnhub.lms.mapper;

import com.learnhub.lms.dto.response.AnnouncementResponse;
import com.learnhub.lms.dto.response.AssignmentResponse;
import com.learnhub.lms.dto.response.AttendanceResponse;
import com.learnhub.lms.dto.response.CourseResponse;
import com.learnhub.lms.dto.response.EnrollmentResponse;
import com.learnhub.lms.dto.response.LessonProgressResponse;
import com.learnhub.lms.dto.response.LessonResponse;
import com.learnhub.lms.dto.response.ModuleResponse;
import com.learnhub.lms.dto.response.NotificationResponse;
import com.learnhub.lms.dto.response.QuizAnswerResponse;
import com.learnhub.lms.dto.response.QuizAttemptResponse;
import com.learnhub.lms.dto.response.QuizQuestionManagementResponse;
import com.learnhub.lms.dto.response.QuizQuestionResponse;
import com.learnhub.lms.dto.response.QuizResponse;
import com.learnhub.lms.dto.response.SubmissionResponse;
import com.learnhub.lms.dto.response.UserResponse;
import com.learnhub.lms.entity.Announcement;
import com.learnhub.lms.entity.Assignment;
import com.learnhub.lms.entity.Attendance;
import com.learnhub.lms.entity.Course;
import com.learnhub.lms.entity.Enrollment;
import com.learnhub.lms.entity.Lesson;
import com.learnhub.lms.entity.LessonProgress;
import com.learnhub.lms.entity.Module;
import com.learnhub.lms.entity.Notification;
import com.learnhub.lms.entity.Quiz;
import com.learnhub.lms.entity.QuizAnswer;
import com.learnhub.lms.entity.QuizAttempt;
import com.learnhub.lms.entity.QuizQuestion;
import com.learnhub.lms.entity.Submission;
import com.learnhub.lms.entity.User;
import com.learnhub.lms.repository.LessonRepository;
import com.learnhub.lms.repository.QuizQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Central entity -> DTO mapping. Entities are never returned from controllers;
 * this class owns the translation rules (including count lookups for summary
 * fields such as lessonCount / questionCount).
 */
@Component
@RequiredArgsConstructor
public class EntityMapper {

    private final LessonRepository lessonRepository;
    private final QuizQuestionRepository quizQuestionRepository;

    public UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }

    public List<UserResponse> toUserResponses(List<User> users) {
        return users.stream().map(this::toUserResponse).toList();
    }

    public CourseResponse toCourseResponse(Course course) {
        return new CourseResponse(
                course.getId(),
                course.getTitle(),
                course.getCode(),
                course.getDescription(),
                course.getCategory(),
                course.getStatus(),
                course.getFaculty().getId(),
                course.getFaculty().getName(),
                course.getCreatedAt(),
                course.getUpdatedAt()
        );
    }

    public List<CourseResponse> toCourseResponses(List<Course> courses) {
        return courses.stream().map(this::toCourseResponse).toList();
    }

    public ModuleResponse toModuleResponse(Module module) {
        return new ModuleResponse(
                module.getId(),
                module.getCourse().getId(),
                module.getTitle(),
                module.getDescription(),
                module.getDisplayOrder(),
                lessonRepository.countByModuleId(module.getId()),
                module.getCreatedAt(),
                module.getUpdatedAt()
        );
    }

    public List<ModuleResponse> toModuleResponses(List<Module> modules) {
        return modules.stream().map(this::toModuleResponse).toList();
    }

    public LessonResponse toLessonResponse(Lesson lesson) {
        return toLessonResponse(lesson, null);
    }

    public LessonResponse toLessonResponse(Lesson lesson, Boolean completed) {
        return new LessonResponse(
                lesson.getId(),
                lesson.getModule().getId(),
                lesson.getTitle(),
                lesson.getDescription(),
                lesson.getContentType(),
                lesson.getContentUrl(),
                lesson.getDuration(),
                lesson.getDisplayOrder(),
                completed,
                lesson.getCreatedAt(),
                lesson.getUpdatedAt()
        );
    }

    public List<LessonResponse> toLessonResponses(List<Lesson> lessons) {
        return lessons.stream().map(this::toLessonResponse).toList();
    }

    public EnrollmentResponse toEnrollmentResponse(Enrollment enrollment) {
        return new EnrollmentResponse(
                enrollment.getId(),
                enrollment.getStudent().getId(),
                enrollment.getStudent().getName(),
                enrollment.getCourse().getId(),
                enrollment.getCourse().getTitle(),
                enrollment.getProgress(),
                enrollment.getStatus(),
                enrollment.getEnrolledAt(),
                enrollment.getCompletedAt()
        );
    }

    public List<EnrollmentResponse> toEnrollmentResponses(List<Enrollment> enrollments) {
        return enrollments.stream().map(this::toEnrollmentResponse).toList();
    }

    public LessonProgressResponse toLessonProgressResponse(LessonProgress progress) {
        return new LessonProgressResponse(
                progress.getId(),
                progress.getStudent().getId(),
                progress.getLesson().getId(),
                progress.isCompleted(),
                progress.getCompletedAt()
        );
    }

    public AssignmentResponse toAssignmentResponse(Assignment assignment) {
        return new AssignmentResponse(
                assignment.getId(),
                assignment.getCourse().getId(),
                assignment.getCourse().getTitle(),
                assignment.getTitle(),
                assignment.getDescription(),
                assignment.getDueDate(),
                assignment.getMaxMarks(),
                assignment.getStatus(),
                assignment.getCreatedAt(),
                assignment.getUpdatedAt()
        );
    }

    public List<AssignmentResponse> toAssignmentResponses(List<Assignment> assignments) {
        return assignments.stream().map(this::toAssignmentResponse).toList();
    }

    public SubmissionResponse toSubmissionResponse(Submission submission) {
        String gradedByName = submission.getGradedBy() != null
                ? submission.getGradedBy().getName()
                : null;
        return new SubmissionResponse(
                submission.getId(),
                submission.getAssignment().getId(),
                submission.getAssignment().getTitle(),
                submission.getStudent().getId(),
                submission.getStudent().getName(),
                submission.getFileName(),
                submission.getFileUrl(),
                submission.getSubmittedAt(),
                submission.getStatus(),
                submission.getScore(),
                submission.getFeedback(),
                submission.getGradedAt(),
                gradedByName
        );
    }

    public List<SubmissionResponse> toSubmissionResponses(List<Submission> submissions) {
        return submissions.stream().map(this::toSubmissionResponse).toList();
    }

    public QuizResponse toQuizResponse(Quiz quiz) {
        return new QuizResponse(
                quiz.getId(),
                quiz.getCourse().getId(),
                quiz.getCourse().getTitle(),
                quiz.getTitle(),
                quiz.getDescription(),
                quiz.getDurationMinutes(),
                quiz.getMaxAttempts(),
                quiz.getStatus(),
                quizQuestionRepository.countByQuizId(quiz.getId()),
                quiz.getCreatedAt(),
                quiz.getUpdatedAt()
        );
    }

    public List<QuizResponse> toQuizResponses(List<Quiz> quizzes) {
        return quizzes.stream().map(this::toQuizResponse).toList();
    }

    public QuizQuestionResponse toQuizQuestionResponse(QuizQuestion question) {
        return new QuizQuestionResponse(
                question.getId(),
                question.getQuiz().getId(),
                question.getQuestionText(),
                question.getOptionA(),
                question.getOptionB(),
                question.getOptionC(),
                question.getOptionD(),
                question.getMarks(),
                question.getDisplayOrder()
        );
    }

    public QuizQuestionManagementResponse toQuizQuestionManagementResponse(QuizQuestion question) {
        return new QuizQuestionManagementResponse(
                question.getId(),
                question.getQuiz().getId(),
                question.getQuestionText(),
                question.getOptionA(),
                question.getOptionB(),
                question.getOptionC(),
                question.getOptionD(),
                question.getCorrectOption(),
                question.getMarks(),
                question.getDisplayOrder()
        );
    }

    public QuizAttemptResponse toQuizAttemptResponse(QuizAttempt attempt) {
        return new QuizAttemptResponse(
                attempt.getId(),
                attempt.getQuiz().getId(),
                attempt.getQuiz().getTitle(),
                attempt.getStudent().getId(),
                attempt.getStudent().getName(),
                attempt.getStartedAt(),
                attempt.getSubmittedAt(),
                attempt.getScore(),
                attempt.getStatus()
        );
    }

    public List<QuizAttemptResponse> toQuizAttemptResponses(List<QuizAttempt> attempts) {
        return attempts.stream().map(this::toQuizAttemptResponse).toList();
    }

    public QuizAnswerResponse toQuizAnswerResponse(QuizAnswer answer) {
        return new QuizAnswerResponse(
                answer.getId(),
                answer.getAttempt().getId(),
                answer.getQuestion().getId(),
                answer.getSelectedOption(),
                answer.isCorrect(),
                answer.getMarksObtained()
        );
    }

    public AttendanceResponse toAttendanceResponse(Attendance attendance) {
        return new AttendanceResponse(
                attendance.getId(),
                attendance.getCourse().getId(),
                attendance.getCourse().getTitle(),
                attendance.getStudent().getId(),
                attendance.getStudent().getName(),
                attendance.getAttendanceDate(),
                attendance.getStatus(),
                attendance.getMarkedBy() != null ? attendance.getMarkedBy().getId() : null,
                attendance.getCreatedAt()
        );
    }

    public List<AttendanceResponse> toAttendanceResponses(List<Attendance> records) {
        return records.stream().map(this::toAttendanceResponse).toList();
    }

    public AnnouncementResponse toAnnouncementResponse(Announcement announcement) {
        return new AnnouncementResponse(
                announcement.getId(),
                announcement.getCourse().getId(),
                announcement.getCourse().getTitle(),
                announcement.getFaculty().getId(),
                announcement.getFaculty().getName(),
                announcement.getTitle(),
                announcement.getContent(),
                announcement.getCreatedAt(),
                announcement.getUpdatedAt()
        );
    }

    public List<AnnouncementResponse> toAnnouncementResponses(List<Announcement> announcements) {
        return announcements.stream().map(this::toAnnouncementResponse).toList();
    }

    public NotificationResponse toNotificationResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getUser().getId(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getType(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }

    public List<NotificationResponse> toNotificationResponses(List<Notification> notifications) {
        return notifications.stream().map(this::toNotificationResponse).toList();
    }
}