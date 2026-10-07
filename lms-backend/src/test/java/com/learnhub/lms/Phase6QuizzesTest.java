package com.learnhub.lms;

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

  private String ownerTok;
  private String otherTok;
  private String studentTok;
  private String freshTok;

  @BeforeEach
  void seed() {
    ownerTok = token(mk("p6-owner", Role.faculty));
    otherTok = token(mk("p6-other", Role.faculty));
    studentTok = token(mk("p6-student", Role.student));
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
