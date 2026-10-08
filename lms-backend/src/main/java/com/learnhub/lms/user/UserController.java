package com.learnhub.lms.user;

import com.learnhub.lms.common.Authz;
import com.learnhub.lms.common.PageResponse;
import com.learnhub.lms.storage.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/** Users, profile & directories (plan §9.2). List/detail mutations are ADMIN. */
@RestController
@Tag(name = "users", description = "Profile, user admin, student/faculty directories")
public class UserController {

  private final UserService service;
  private final FileStorageService storage;
  private final Authz authz;

  public UserController(UserService service, FileStorageService storage, Authz authz) {
    this.service = service;
    this.storage = storage;
    this.authz = authz;
  }

  @GetMapping("/api/users/me")
  @Operation(summary = "Own profile")
  public UserDto me() {
    return service.getMe(authz.currentUserId());
  }

  @PatchMapping("/api/users/me")
  @Operation(summary = "Update own profile (email stays unique)")
  public UserDto updateMe(@Valid @RequestBody UpdateProfileRequest patch) {
    return service.updateMe(authz.currentUserId(), patch);
  }

  @PostMapping("/api/users/me/password")
  @Operation(summary = "Change own password (current required)")
  public Map<String, Object> changePassword(@Valid @RequestBody PasswordChangeRequest req) {
    service.changePassword(authz.currentUserId(), req);
    return Map.of("ok", true);
  }

  @PostMapping(value = "/api/users/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Upload own avatar image, all roles (5 MB max)")
  public UserDto uploadAvatar(@RequestParam("file") MultipartFile file) {
    return service.setAvatar(authz.currentUserId(),
        storage.storeAvatar(file).url());
  }

  @GetMapping("/api/users")
  @Operation(summary = "Admin user search (ADMIN). X-Total-Count header included")
  public ResponseEntity<PageResponse<UserDto>> list(
      @RequestParam(required = false) String query,
      @RequestParam(required = false) String role,
      @RequestParam(required = false) String status,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    PageResponse<UserDto> body = service.listUsers(query, role, status, page, size);
    return ResponseEntity.ok().header("X-Total-Count", String.valueOf(body.total())).body(body);
  }

  @PostMapping("/api/users")
  @Operation(summary = "Create a user with a temp password (ADMIN, audited)")
  public ResponseEntity<UserDto> create(@Valid @RequestBody CreateUserRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.createUser(req));
  }

  @GetMapping("/api/users/{id}")
  @Operation(summary = "User detail (ADMIN | self | faculty of an enrolled student)")
  public UserDto get(@PathVariable Long id) {
    return service.getUser(id);
  }

  @PatchMapping("/api/users/{id}/role")
  @Operation(summary = "Change role (ADMIN, audited)")
  public UserDto setRole(@PathVariable Long id, @Valid @RequestBody RoleUpdateRequest req) {
    return service.setRole(id, req);
  }

  @PatchMapping("/api/users/{id}/status")
  @Operation(summary = "Set or toggle status (ADMIN, audited)")
  public UserDto setStatus(@PathVariable Long id, @RequestBody StatusUpdateRequest req) {
    return service.setStatus(id, req == null ? new StatusUpdateRequest(null, true) : req);
  }

  @PatchMapping("/api/users/{id}/verify-email")
  @Operation(summary = "Manually mark email verified, skipping OTP (ADMIN, audited)")
  public UserDto verifyEmail(@PathVariable Long id) {
    return service.verifyEmail(id);
  }

  @GetMapping("/api/students")
  @Operation(summary = "Admin student directory, derived live")
  public ResponseEntity<PageResponse<StudentRow>> students(
      @RequestParam(required = false) String query,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String program,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    PageResponse<StudentRow> body = service.listStudents(query, status, program, page, size);
    return ResponseEntity.ok().header("X-Total-Count", String.valueOf(body.total())).body(body);
  }

  @GetMapping("/api/faculty")
  @Operation(summary = "Admin faculty directory, derived live")
  public ResponseEntity<PageResponse<FacultyRow>> faculty(
      @RequestParam(required = false) String query,
      @RequestParam(required = false) String dept,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    PageResponse<FacultyRow> body = service.listFaculty(query, dept, page, size);
    return ResponseEntity.ok().header("X-Total-Count", String.valueOf(body.total())).body(body);
  }
}
