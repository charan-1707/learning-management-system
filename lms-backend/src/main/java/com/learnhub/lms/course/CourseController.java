package com.learnhub.lms.course;

import com.learnhub.lms.common.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Courses (plan §9.3). Students see published-or-NULL; drafts are guarded. */
@RestController
@RequestMapping("/api/courses")
@Tag(name = "courses", description = "Course catalog and management")
public class CourseController {

  private final CourseService service;

  public CourseController(CourseService service) {
    this.service = service;
  }

  @GetMapping
  @Operation(summary = "Catalog search (query matches name/code/instructor/category)")
  public ResponseEntity<PageResponse<CourseDto>> list(
      @RequestParam(required = false) String query,
      @RequestParam(required = false) String status,
      @RequestParam(required = false) String category,
      @RequestParam(required = false) Long instructorId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    PageResponse<CourseDto> body = service.list(query, status, category, instructorId, page, size);
    return ResponseEntity.ok().header("X-Total-Count", String.valueOf(body.total())).body(body);
  }

  @PostMapping
  @Operation(summary = "Create course (FACULTY/ADMIN, defaults to draft)")
  public ResponseEntity<CourseDto> create(@Valid @RequestBody CourseCreateRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
  }

  @GetMapping("/mine")
  @Operation(summary = "Owned courses (faculty) or enrolled with progress (student)")
  public List<?> mine() {
    return service.mine();
  }

  @GetMapping("/{id}")
  @Operation(summary = "Course detail (draft: owner/admin/enrolled only)")
  public CourseDto get(@PathVariable String id) {
    return service.detail(id);
  }

  @PatchMapping("/{id}")
  @Operation(summary = "Update course (owner/ADMIN)")
  public CourseDto update(@PathVariable String id, @Valid @RequestBody CourseUpdateRequest req) {
    return service.update(id, req);
  }

  @PatchMapping("/{id}/status")
  @Operation(summary = "Publish/draft toggle (owner/ADMIN)")
  public CourseDto setStatus(@PathVariable String id, @Valid @RequestBody CourseStatusRequest req) {
    return service.setStatus(id, req);
  }

  @DeleteMapping("/{id}")
  @Operation(summary = "Delete course with full cascade (owner/ADMIN)")
  public Map<String, Object> delete(@PathVariable String id) {
    service.delete(id);
    return Map.of("ok", true);
  }

  @GetMapping("/{id}/roster")
  @Operation(summary = "Enrolled-student roster (owner/ADMIN)")
  public List<RosterRow> roster(@PathVariable String id) {
    return service.roster(id);
  }
}
