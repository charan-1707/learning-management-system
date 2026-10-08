package com.learnhub.lms.user;

import com.learnhub.lms.admin.ActivityEvent;
import com.learnhub.lms.admin.ActivityEventRepository;
import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.common.PageResponse;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Users & profile rules (plan §7): self-service profile, admin search with
 * filters, role/status mutations with audit rows, live directories.
 */
@Service
public class UserService {

  private final UserRepository users;
  private final CourseRepository courses;
  private final EnrollmentRepository enrollments;
  private final ActivityEventRepository events;
  private final PasswordEncoder passwords;
  private final Authz authz;
  private final StudentDirectoryService students;
  private final FacultyDirectoryService faculty;

  public UserService(UserRepository users, CourseRepository courses,
      EnrollmentRepository enrollments, ActivityEventRepository events,
      PasswordEncoder passwords, Authz authz,
      StudentDirectoryService students, FacultyDirectoryService faculty) {
    this.users = users;
    this.courses = courses;
    this.enrollments = enrollments;
    this.events = events;
    this.passwords = passwords;
    this.authz = authz;
    this.students = students;
    this.faculty = faculty;
  }

  @Transactional(readOnly = true)
  public UserDto getMe(Long userId) {
    return UserDto.from(authz.currentUser());
  }

  @Transactional
  public UserDto updateMe(Long userId, UpdateProfileRequest patch) {
    User me = authz.currentUser();
    if (patch.name() != null) {
      me.setName(patch.name().trim());
    }
    if (patch.email() != null) {
      String email = patch.email().trim();
      if (!email.equalsIgnoreCase(me.getEmail())
          && users.findByEmail(email).isPresent()) {
        throw ApiException.badRequest("Email is already in use.");
      }
      me.setEmail(email);
    }
    if (patch.phone() != null) {
      me.setPhone(patch.phone().trim());
    }
    if (patch.location() != null) {
      me.setLocation(patch.location().trim());
    }
    if (patch.program() != null) {
      me.setProgram(patch.program().trim());
    }
    if (patch.yearLabel() != null) {
      me.setYearLabel(patch.yearLabel().trim());
    }
    if (patch.dept() != null) {
      me.setDept(patch.dept().trim());
    }
    if (patch.title() != null) {
      me.setTitle(patch.title().trim());
    }
    me.setUpdatedAt(LocalDateTime.now());
    return UserDto.from(users.save(me));
  }

  @Transactional
  public UserDto setAvatar(Long userId, String avatarUrl) {
    User me = authz.currentUser();
    me.setAvatarUrl(avatarUrl);
    me.setUpdatedAt(LocalDateTime.now());
    return UserDto.from(users.save(me));
  }

  @Transactional
  public void changePassword(Long userId, PasswordChangeRequest req) {    User me = authz.currentUser();
    if (!passwords.matches(req.current(), me.getPasswordHash())) {
      throw ApiException.badRequest("Current password is incorrect.");
    }
    me.setPasswordHash(passwords.encode(req.next()));
    me.setUpdatedAt(LocalDateTime.now());
    users.save(me);
  }

  @Transactional(readOnly = true)
  public PageResponse<UserDto> listUsers(String query, String role, String status, int page, int size) {
    authz.requireAdmin();
    Role roleEnum = parseRole(role);
    UserStatus statusEnum = parseStatus(status);
    Pageable pageable = PageRequest.of(page, Math.min(size, 100), Sort.by("name").ascending());
    Page<User> found = users.search(blankToNull(query), roleEnum, statusEnum, pageable);
    return new PageResponse<>(found.map(UserDto::from).toList(), found.getTotalElements(), page, size);
  }

  @Transactional(readOnly = true)
  public UserDto getUser(Long id) {
    User me = authz.currentUser();
    if (me.getRole() == Role.admin || me.getId().equals(id)) {
      return UserDto.from(findOr404(id));
    }
    if (me.getRole() == Role.faculty && teachesStudent(me.getId(), id)) {
      return UserDto.from(findOr404(id));
    }
    throw ApiException.forbidden("Forbidden");
  }

  @Transactional
  public UserDto createUser(CreateUserRequest req) {
    authz.requireAdmin();
    String cleanEmail = req.email().trim().toLowerCase();
    if (users.findByEmail(cleanEmail).isPresent()) {
      throw ApiException.conflict("An account with this email already exists.");
    }
    Role role;
    try {
      role = Role.valueOf(req.role());
    } catch (IllegalArgumentException ex) {
      throw ApiException.badRequest("Unknown role.");
    }
    User u = new User();
    u.setName(req.name().trim());
    u.setEmail(cleanEmail);
    u.setPasswordHash(passwords.encode(req.password()));
    u.setRole(role);
    u.setStatus(UserStatus.active);
    u.setEmailVerified(true); /* admin-created: identity vouched by the admin */
    User saved = users.save(u);
    audit("user", "Created " + role + " account for " + saved.getName()
        + " (" + saved.getEmail() + ")");
    return UserDto.from(saved);
  }

  @Transactional
  public UserDto setRole(Long id, RoleUpdateRequest req) {
    authz.requireAdmin();
    User target = findOr404(id);
    Role next = Role.valueOf(req.role());
    Role prev = target.getRole();
    target.setRole(next);
    target.setUpdatedAt(LocalDateTime.now());
    users.save(target);
    audit("user", "Changed role of " + target.getName() + " (" + target.getEmail() + ") from "
        + prev + " to " + next);
    return UserDto.from(target);
  }

  @Transactional
  public UserDto verifyEmail(Long id) {
    authz.requireAdmin();
    User target = findOr404(id);
    target.setEmailVerified(true);
    target.setUpdatedAt(LocalDateTime.now());
    users.save(target);
    audit("user", "Manually verified email of " + target.getName()
        + " (" + target.getEmail() + ") — OTP bypass by admin");
    return UserDto.from(target);
  }

  @Transactional
  public UserDto setStatus(Long id, StatusUpdateRequest req) {
    authz.requireAdmin();
    User target = findOr404(id);
    UserStatus next;
    if (req.status() != null) {
      next = UserStatus.fromDb(req.status());
    } else {
      next = target.getStatus() == UserStatus.suspended ? UserStatus.active : UserStatus.suspended;
    }
    UserStatus prev = target.getStatus();
    target.setStatus(next);
    target.setUpdatedAt(LocalDateTime.now());
    users.save(target);
    audit("user", "Set status of " + target.getName() + " (" + target.getEmail() + ") from "
        + (prev == null ? null : prev.dbValue) + " to " + next.dbValue);
    return UserDto.from(target);
  }

  @Transactional(readOnly = true)
  public PageResponse<StudentRow> listStudents(String query, String status, String program,
      int page, int size) {
    authz.requireAdmin();
    List<User> all = users.findAll(Sort.by("name").ascending());
    List<StudentRow> rows = all.stream()
        .filter(u -> u.getRole() == Role.student)
        .filter(u -> matches(query, u.getName(), u.getEmail()))
        .filter(u -> status == null || status.isBlank()
            || (u.getStatus() != null && u.getStatus().dbValue.equals(status)))
        .filter(u -> program == null || program.isBlank()
            || (u.getProgram() != null && u.getProgram().equalsIgnoreCase(program)))
        .map(students::row)
        .toList();
    return paginate(rows, page, size);
  }

  @Transactional(readOnly = true)
  public PageResponse<FacultyRow> listFaculty(String query, String dept, int page, int size) {
    authz.requireAdmin();
    List<User> all = users.findAll(Sort.by("name").ascending());
    List<FacultyRow> rows = all.stream()
        .filter(u -> u.getRole() == Role.faculty)
        .filter(u -> matches(query, u.getName(), u.getEmail()))
        .filter(u -> dept == null || dept.isBlank()
            || (u.getDept() != null && u.getDept().equalsIgnoreCase(dept)))
        .map(faculty::row)
        .toList();
    return paginate(rows, page, size);
  }

  // ---- helpers ----

  private User findOr404(Long id) {
    return users.findById(id).orElseThrow(() -> ApiException.notFound("User not found."));
  }

  private boolean teachesStudent(Long facultyId, Long studentId) {
    return courses.findByInstructor_Id(facultyId).stream()
        .anyMatch(c -> enrollments.existsByStudent_IdAndCourse_Id(studentId, c.getId()));
  }

  private void audit(String type, String text) {
    ActivityEvent event = new ActivityEvent();
    event.setActorId(authz.currentUserId());
    event.setType(type);
    event.setText(text);
    event.setCreatedAt(LocalDateTime.now());
    events.save(event);
  }

  private static boolean matches(String query, String... fields) {
    if (query == null || query.isBlank()) {
      return true;
    }
    String q = query.toLowerCase();
    for (String f : fields) {
      if (f != null && f.toLowerCase().contains(q)) {
        return true;
      }
    }
    return false;
  }

  private static <T> PageResponse<T> paginate(List<T> rows, int page, int size) {
    int capped = Math.min(Math.max(size, 1), 100);
    int from = Math.min(Math.max(page, 0) * capped, rows.size());
    int to = Math.min(from + capped, rows.size());
    return new PageResponse<>(rows.subList(from, to), rows.size(), page, size);
  }

  private static String blankToNull(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }

  private static Role parseRole(String role) {
    if (role == null || role.isBlank()) {
      return null;
    }
    try {
      return Role.valueOf(role.trim());
    } catch (IllegalArgumentException ex) {
      throw ApiException.badRequest("role must be student, faculty or admin");
    }
  }

  private static UserStatus parseStatus(String status) {
    if (status == null || status.isBlank()) {
      return null;
    }
    try {
      return UserStatus.fromDb(status.trim());
    } catch (IllegalArgumentException ex) {
      throw ApiException.badRequest("status must be active, suspended, warning or on-leave");
    }
  }
}
