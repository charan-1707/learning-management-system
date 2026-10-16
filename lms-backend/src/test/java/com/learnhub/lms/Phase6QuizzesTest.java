package com.learnhub.lms;

import com.learnhub.lms.enrollment.LessonProgress;
import com.learnhub.lms.enrollment.LessonProgressRepository;
import com.learnhub.lms.security.JwtService;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import com.learnhub.lms.user.UserRepository;
import com.learnhub.lms.user.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Phase 6 acceptance (plan §11) on H2: answer stripping, server scoring,
 * attempt/due guards, per-student taken, grade-row write, best-score updates.
 */
@SpringBootTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@AutoConfigureMockMvc
class Phase6QuizzesTest {

  private static final String QUESTIONS = "{\"questions\":["
      + "{\"q\":\"Q1?\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"answer\":2},"
      + "{\"q\":\"Q2?\",\"options\":[\"A\",\"B\",\"C\",\"D\"],\"answer\":0}]}";

  @Autowired MockMvc mvc;
  @Autowired UserRepository users;
  @Autowired PasswordEncoder passwords;
  @Autowired JwtService jwt;
  @Autowired LessonProgressRepository progressRows;

  private String ownerTok;
  private String otherTok;
  private String studentTok;
  private String freshTok;
  private User studentUser;

  @BeforeEach
  void seed() {
    ownerTok = token(mk("p6-owner", Role.faculty));
    otherTok = token(mk("p6-other", Role.faculty));
    studentUser = mk("p6-student", Role.student);
    studentTok = token(studentUser);
    freshTok = token(mk("p6-fresh", Role.student));
  }

  private User mk(String kind, Role role) {
    User u = new User();
    u.setName("P6 " + kind + " " + System.nanoTime());
    u.setEmail(kind + "." + System.nanoTime() + "@learnhub.test");
    u.setPasswordHash(passwords.encode("pw"));
    u.setRole(role);
    u.setStatus(UserStatus.active);
    return users.saveAndFlush(u);
  }

  private String token(User u) {
    return jwt.issueAccessToken(String.valueOf(u.getId()), u.getRole().name(), u.getEmail());
  }

  private String openCourse() throws Exception {
    MvcResult r = mvc.perform(post("/api/courses").header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"P6 Course " + System.nanoTime() + "\"}"))
        .andExpect(status().isCreated())
        .andReturn();
    String id = r.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];
    mvc.perform(patch("/api/courses/" + id + "/status")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"status\":\"published\"}"))
        .andExpect(status().isOk());
    mvc.perform(post("/api/courses/" + id + "/enroll")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isCreated());
    return id;
  }

  private String quiz(String courseId, String dueJson) throws Exception {
    MvcResult r = mvc.perform(post("/api/quizzes").header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"courseId\":\"" + courseId + "\",\"title\":\"Quiz "
                + System.nanoTime() + "\",\"attemptsMax\":2" + dueJson + "}"))
        .andExpect(status().isCreated())
        .andReturn();
    String id = r.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];
    mvc.perform(put("/api/quizzes/" + id + "/questions")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content(QUESTIONS))
        .andExpect(status().isOk());
    return id;
  }

  private String finalQuiz(String courseId) throws Exception {
    MvcResult r = mvc.perform(post("/api/quizzes").header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"courseId\":\"" + courseId + "\",\"title\":\"Final "
                + System.nanoTime() + "\",\"attemptsMax\":2,\"finalExam\":true}"))
        .andExpect(status().isCreated())
        .andReturn();
    String id = r.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];
    mvc.perform(put("/api/quizzes/" + id + "/questions")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content(QUESTIONS))
        .andExpect(status().isOk());
    return id;
  }

  private String addModule(String tok, String courseId, String title) throws Exception {
    MvcResult r = mvc.perform(post("/api/courses/" + courseId + "/modules")
            .header("Authorization", "Bearer " + tok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"" + title + "\"}"))
        .andExpect(status().isCreated())
        .andReturn();
    return r.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];
  }

  private String addLesson(String tok, String moduleId, String title) throws Exception {
    MvcResult r = mvc.perform(post("/api/modules/" + moduleId + "/lessons")
            .header("Authorization", "Bearer " + tok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"" + title + "\",\"type\":\"pdf\"}"))
        .andExpect(status().isCreated())
        .andReturn();
    return r.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];
  }

  private void completeAged(String tok, String lessonId, int secondsAgo) throws Exception {
    mvc.perform(post("/api/lessons/" + lessonId + "/viewed")
            .header("Authorization", "Bearer " + tok))
        .andExpect(status().isOk());
    LessonProgress row = progressRows
        .findByStudent_IdAndLesson_Id(studentUser.getId(), lessonId).orElseThrow();
    row.setCreatedAt(LocalDateTime.now().minusSeconds(secondsAgo));
    progressRows.saveAndFlush(row);
    mvc.perform(post("/api/lessons/" + lessonId + "/complete")
            .header("Authorization", "Bearer " + tok))
        .andExpect(status().isOk());
  }

  @Test
  void answersStrippedForStudents() throws Exception {
    String courseId = openCourse();
    String qid = quiz(courseId, ",\"dueAt\":\"2030-01-01T10:00:00\"");

    mvc.perform(get("/api/quizzes/" + qid + "/questions")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].question").exists())
        .andExpect(jsonPath("$[0].options").isArray())
        .andExpect(jsonPath("$[0].answer").doesNotExist())
        .andExpect(jsonPath("$[0].answerIndex").doesNotExist());

    mvc.perform(get("/api/quizzes/" + qid + "/questions")
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].answer").value(2));

    mvc.perform(get("/api/quizzes/" + qid + "/questions")
            .header("Authorization", "Bearer " + freshTok))
        .andExpect(status().isForbidden());
  }

  @Test
  void attemptScoresServerSide() throws Exception {
    String courseId = openCourse();
    String qid = quiz(courseId, ",\"dueAt\":\"2030-01-01T10:00:00\"");

    mvc.perform(post("/api/quizzes/" + qid + "/attempts")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"answers\":[2,1]}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.score").value(1))
        .andExpect(jsonPath("$.total").value(2))
        .andExpect(jsonPath("$.pct").value(50))
        .andExpect(jsonPath("$.grade").value("F"))
        .andExpect(jsonPath("$.bestScore").value("1/2"))
        .andExpect(jsonPath("$.attempts").value(1));

    mvc.perform(get("/api/quizzes/" + qid + "/attempts/me")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].score").value(1));

    // best improves on retake; grade row follows the best
    mvc.perform(post("/api/quizzes/" + qid + "/attempts")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"answers\":[2,0]}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.score").value(2))
        .andExpect(jsonPath("$.bestScore").value("2/2"))
        .andExpect(jsonPath("$.attempts").value(2));

    mvc.perform(get("/api/students/me/grades")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.type=='quiz')].score").isNotEmpty());

    // taken filter is per-student
    mvc.perform(get("/api/quizzes?taken=true").header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.id=='" + qid + "')]").isNotEmpty());
    mvc.perform(get("/api/quizzes?taken=false").header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.id=='" + qid + "')]").isEmpty());
  }

  @Test
  void overAttemptAndLateAttemptBlocked() throws Exception {
    String courseId = openCourse();
    MvcResult r = mvc.perform(post("/api/quizzes").header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"courseId\":\"" + courseId + "\",\"title\":\"Once "
                + System.nanoTime() + "\",\"attemptsMax\":1}"))
        .andExpect(status().isCreated())
        .andReturn();
    String once = r.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];
    mvc.perform(put("/api/quizzes/" + once + "/questions")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content(QUESTIONS))
        .andExpect(status().isOk());

    mvc.perform(post("/api/quizzes/" + once + "/attempts")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"answers\":[2,0]}"))
        .andExpect(status().isCreated());
    mvc.perform(post("/api/quizzes/" + once + "/attempts")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"answers\":[2,0]}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.ok").value(false));

    String late = quiz(courseId, ",\"dueAt\":\"2020-01-01T10:00:00\"");
    mvc.perform(post("/api/quizzes/" + late + "/attempts")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"answers\":[2,0]}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.ok").value(false));
  }

  @Test
  void updateQuizHeader() throws Exception {
    String courseId = openCourse();
    String qid = quiz(courseId, "");
    mvc.perform(patch("/api/quizzes/" + qid).header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"Renamed\",\"attemptsMax\":5}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("Renamed"))
        .andExpect(jsonPath("$.attemptsMax").value(5));
    mvc.perform(patch("/api/quizzes/" + qid).header("Authorization", "Bearer " + otherTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"title\":\"Hijacked\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void replaceBlockedAfterAttemptsAndAttemptsVisible() throws Exception {
    String courseId = openCourse();
    String qid = quiz(courseId, ",\"dueAt\":\"2030-01-01T10:00:00\"");
    mvc.perform(post("/api/quizzes/" + qid + "/attempts")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"answers\":[2,0]}"))
        .andExpect(status().isCreated());
    mvc.perform(put("/api/quizzes/" + qid + "/questions")
            .header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content(QUESTIONS))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.ok").value(false));
    mvc.perform(get("/api/quizzes/" + qid + "/attempts")
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].studentName").exists())
        .andExpect(jsonPath("$[0].score").value(2));
    mvc.perform(get("/api/quizzes/" + qid + "/attempts")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isForbidden());
  }

  @Test
  void quizOpenedNotifiesEnrolled() throws Exception {
    String courseId = openCourse();
    MvcResult before = mvc.perform(get("/api/notifications/unread-count")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andReturn();
    long n0 = Long.parseLong(before.getResponse().getContentAsString().split("\"count\":")[1].split("}")[0]);

    quiz(courseId, "");
    MvcResult after = mvc.perform(get("/api/notifications/unread-count")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andReturn();
    long n1 = Long.parseLong(after.getResponse().getContentAsString().split("\"count\":")[1].split("}")[0]);
    org.junit.jupiter.api.Assertions.assertEquals(n0 + 1, n1);

    mvc.perform(get("/api/notifications/me").header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.type=='quiz')]").isNotEmpty());

    String freshTok = token(mk("p6-nonotif", Role.student));
    mvc.perform(get("/api/notifications/unread-count").header("Authorization", "Bearer " + freshTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.count").value(0));
  }

  @Test
  void finalQuizLockedBelowSeventyPercent() throws Exception {
    String courseId = openCourse();
    String m = addModule(ownerTok, courseId, "M");
    addLesson(ownerTok, m, "L1");
    addLesson(ownerTok, m, "L2");
    String f = finalQuiz(courseId);

    // 0% completed: the gate refuses with the 70% message.
    mvc.perform(post("/api/quizzes/" + f + "/attempts")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"answers\":[2,0]}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error", org.hamcrest.Matchers.containsString("70%")));
  }

  @Test
  void finalQuizUnlockedAfterProgressReportsPass() throws Exception {
    String courseId = openCourse();
    String m = addModule(ownerTok, courseId, "M");
    String l1 = addLesson(ownerTok, m, "L1");
    String l2 = addLesson(ownerTok, m, "L2");
    String f = finalQuiz(courseId);

    // Complete every lesson (viewed + aged past the pdf dwell), then attempt.
    completeAged(studentTok, l1, 61);
    completeAged(studentTok, l2, 61);

    // All wrong first: recorded, marked failed.
    mvc.perform(post("/api/quizzes/" + f + "/attempts")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"answers\":[1,1]}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.pct").value(0))
        .andExpect(jsonPath("$.passed").value(false));

    // All right: best score kept, marked passed.
    mvc.perform(post("/api/quizzes/" + f + "/attempts")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"answers\":[2,0]}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.pct").value(100))
        .andExpect(jsonPath("$.passed").value(true))
        .andExpect(jsonPath("$.bestScore").value("2/2"));
  }

  @Test
  void secondFinalRejectedAndFlagToggleable() throws Exception {
    String courseId = openCourse();
    String f = finalQuiz(courseId);
    mvc.perform(get("/api/quizzes/" + f).header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.finalExam").value(true));

    // One final per course.
    mvc.perform(post("/api/quizzes").header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"courseId\":\"" + courseId + "\",\"title\":\"Second Final\",\"finalExam\":true}"))
        .andExpect(status().isBadRequest());

    // Unmark frees the slot.
    mvc.perform(patch("/api/quizzes/" + f).header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"finalExam\":false}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.finalExam").value(false));
    mvc.perform(post("/api/quizzes").header("Authorization", "Bearer " + ownerTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"courseId\":\"" + courseId + "\",\"title\":\"Second Final\",\"finalExam\":true}"))
        .andExpect(status().isCreated());
  }

  @Test
  void deleteQuizCascades() throws Exception {
    String courseId = openCourse();
    String qid = quiz(courseId, "");
    mvc.perform(post("/api/quizzes/" + qid + "/attempts")
            .header("Authorization", "Bearer " + studentTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"answers\":[2,0]}"))
        .andExpect(status().isCreated());

    mvc.perform(delete("/api/quizzes/" + qid).header("Authorization", "Bearer " + otherTok))
        .andExpect(status().isForbidden());
    mvc.perform(delete("/api/quizzes/" + qid).header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isOk());

    mvc.perform(get("/api/quizzes/" + qid + "/questions")
            .header("Authorization", "Bearer " + ownerTok))
        .andExpect(status().isNotFound());
  }
}
