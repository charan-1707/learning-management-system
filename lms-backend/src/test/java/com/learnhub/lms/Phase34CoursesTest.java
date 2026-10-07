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
 * Phase 3–4 acceptance (plan §8–§9) on H2: draft visibility, ownership,
 * reorder, cascade, search filters, enroll guards, idempotent completion.
 */
@SpringBootTest(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@AutoConfigureMockMvc
class Phase34CoursesTest {

  @Autowired MockMvc mvc;
  @Autowired UserRepository users;
  @Autowired PasswordEncoder passwords;
  @Autowired JwtService jwt;

  private String facultyTok;
  private String otherFacultyTok;
  private String studentTok;
  private String adminTok;

  @BeforeEach
  void seed() {
    facultyTok = token(mk("p34-owner", Role.faculty));
    otherFacultyTok = token(mk("p34-other", Role.faculty));
    studentTok = token(mk("p34-student", Role.student));
    adminTok = token(mk("p34-admin", Role.admin));
  }

  private User mk(String kind, Role role) {
    User u = new User();
    u.setName("P34 " + kind + " " + System.nanoTime());
    u.setEmail(kind + "." + System.nanoTime() + "@learnhub.test");
    u.setPasswordHash(passwords.encode("pw"));
    u.setRole(role);
    u.setStatus(UserStatus.active);
    return users.saveAndFlush(u);
  }

  private String token(User u) {
    return jwt.issueAccessToken(String.valueOf(u.getId()), u.getRole().name(), u.getEmail());
  }

  private String createCourse(String tok, String name) throws Exception {
    MvcResult r = mvc.perform(post("/api/courses").header("Authorization", "Bearer " + tok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"" + name + "\",\"code\":\"T 101\"}"))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.status").value("draft"))
        .andReturn();
    return r.getResponse().getContentAsString().split("\"id\":\"")[1].split("\"")[0];
  }

  private void publish(String tok, String courseId) throws Exception {
    mvc.perform(patch("/api/courses/" + courseId + "/status")
            .header("Authorization", "Bearer " + tok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"status\":\"published\"}"))
        .andExpect(status().isOk());
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

  @Test
  void studentCannotSeeDraft() throws Exception {
    String id = createCourse(facultyTok, "Draft Only " + System.nanoTime());

    mvc.perform(get("/api/courses").header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.id=='" + id + "')]").isEmpty());

    mvc.perform(get("/api/courses/" + id).header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isForbidden());

    mvc.perform(get("/api/courses/" + id).header("Authorization", "Bearer " + adminTok))
        .andExpect(status().isOk());

    publish(facultyTok, id);

    mvc.perform(get("/api/courses/" + id).header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk());
  }

  @Test
  void nonOwnerFacultyPatchForbidden() throws Exception {
    String id = createCourse(facultyTok, "Owned " + System.nanoTime());

    mvc.perform(patch("/api/courses/" + id).header("Authorization", "Bearer " + otherFacultyTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Hijacked\"}"))
        .andExpect(status().isForbidden());

    mvc.perform(patch("/api/courses/" + id).header("Authorization", "Bearer " + facultyTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Renamed\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Renamed"));
  }

  @Test
  void instructorNamePatchPersistsExactCase() throws Exception {
    String id = createCourse(facultyTok, "Cased " + System.nanoTime());

    mvc.perform(patch("/api/courses/" + id).header("Authorization", "Bearer " + facultyTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"instructorName\":\"DR. ALBUS RAO\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.instructorName").value("DR. ALBUS RAO"));

    // blank must never wipe the stored value
    mvc.perform(patch("/api/courses/" + id).header("Authorization", "Bearer " + facultyTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"instructorName\":\"   \"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.instructorName").value("DR. ALBUS RAO"));
  }

  @Test
  void reorderPersists() throws Exception {
    String id = createCourse(facultyTok, "Reorder " + System.nanoTime());
    String m1 = addModule(facultyTok, id, "First");
    String m2 = addModule(facultyTok, id, "Second");
    String m3 = addModule(facultyTok, id, "Third");

    mvc.perform(put("/api/courses/" + id + "/modules/reorder")
            .header("Authorization", "Bearer " + facultyTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"orderedIds\":[\"" + m3 + "\",\"" + m1 + "\",\"" + m2 + "\"]}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].id").value(m3))
        .andExpect(jsonPath("$[1].id").value(m1))
        .andExpect(jsonPath("$[2].id").value(m2));

    mvc.perform(put("/api/courses/" + id + "/modules/reorder")
            .header("Authorization", "Bearer " + facultyTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"orderedIds\":[\"" + m3 + "\"]}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void deleteCourseCascades() throws Exception {
    String id = createCourse(facultyTok, "Doomed " + System.nanoTime());
    String m = addModule(facultyTok, id, "M");
    String l = addLesson(facultyTok, m, "L");
    publish(facultyTok, id);
    mvc.perform(post("/api/courses/" + id + "/enroll")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isCreated());
    mvc.perform(post("/api/lessons/" + l + "/complete")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk());

    mvc.perform(delete("/api/courses/" + id).header("Authorization", "Bearer " + facultyTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.ok").value(true));

    mvc.perform(get("/api/courses/" + id + "/modules")
            .header("Authorization", "Bearer " + facultyTok))
        .andExpect(status().isNotFound());
  }

  @Test
  void searchFilters() throws Exception {
    String uniq = "Zxq" + System.nanoTime();
    String id = createCourse(facultyTok, uniq + " Physics");
    mvc.perform(patch("/api/courses/" + id).header("Authorization", "Bearer " + facultyTok)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"category\":\"Programming\"}"))
        .andExpect(status().isOk());
    publish(facultyTok, id);

    mvc.perform(get("/api/courses?query=" + uniq + "&category=Programming")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.id=='" + id + "')]").isNotEmpty());

    mvc.perform(get("/api/courses?query=" + uniq + "&category=Data")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[?(@.id=='" + id + "')]").isEmpty());
  }

  @Test
  void enrollGuards() throws Exception {
    String draft = createCourse(facultyTok, "Draft Enroll " + System.nanoTime());
    mvc.perform(post("/api/courses/" + draft + "/enroll")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("This course is not open for enrollment."));

    String open = createCourse(facultyTok, "Open Enroll " + System.nanoTime());
    publish(facultyTok, open);
    mvc.perform(post("/api/courses/" + open + "/enroll")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.ok").value(true));
    mvc.perform(post("/api/courses/" + open + "/enroll")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.error").value("You are already enrolled in this course."));

    mvc.perform(post("/api/courses/" + open + "/enroll")
            .header("Authorization", "Bearer " + facultyTok))
        .andExpect(status().isForbidden());
  }

  @Test
  void completeTwiceIsOneRowAndProgress50() throws Exception {
    String id = createCourse(facultyTok, "Progress " + System.nanoTime());
    String m = addModule(facultyTok, id, "M");
    String l1 = addLesson(facultyTok, m, "L1");
    String l2 = addLesson(facultyTok, m, "L2");
    addLesson(facultyTok, m, "L3");
    addLesson(facultyTok, m, "L4");
    publish(facultyTok, id);
    mvc.perform(post("/api/courses/" + id + "/enroll")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isCreated());

    mvc.perform(post("/api/lessons/" + l1 + "/complete")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.progress.percent").value(25));

    mvc.perform(post("/api/lessons/" + l1 + "/complete")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.progress.completed").value(1));

    mvc.perform(post("/api/lessons/" + l2 + "/complete")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.progress").exists())
        .andExpect(jsonPath("$.progress.total").value(4))
        .andExpect(jsonPath("$.progress.completed").value(2))
        .andExpect(jsonPath("$.progress.percent").value(50));

    mvc.perform(get("/api/courses/" + id + "/progress")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.percent").value(50));

    mvc.perform(get("/api/students/me/enrollments")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.course.id=='" + id + "')].enrollment.progressPercent").value(50));
  }

  @Test
  void lockedFlagAndMine() throws Exception {
    String id = createCourse(facultyTok, "Locked " + System.nanoTime());
    addModule(facultyTok, id, "M");
    publish(facultyTok, id);

    mvc.perform(get("/api/courses/" + id + "/modules")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].locked").value(true));

    mvc.perform(get("/api/courses/mine").header("Authorization", "Bearer " + facultyTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.id=='" + id + "')]").isNotEmpty());

    mvc.perform(post("/api/courses/" + id + "/enroll")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isCreated());

    mvc.perform(get("/api/courses/" + id + "/modules")
            .header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].locked").value(false));

    mvc.perform(get("/api/courses/mine").header("Authorization", "Bearer " + studentTok))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[?(@.course.id=='" + id + "')]").isNotEmpty());
  }
}
