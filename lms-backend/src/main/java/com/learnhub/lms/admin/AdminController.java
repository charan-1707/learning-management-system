package com.learnhub.lms.admin;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

/** Admin console + course student-progress (plan §9.10). All ADMIN. */
@RestController
@Tag(name = "admin", description = "Statistics, reports, settings, exports")
public class AdminController {

  private final AdminService service;

  public AdminController(AdminService service) {
    this.service = service;
  }

  @GetMapping("/api/admin/statistics")
  @Operation(summary = "Live platform KPIs")
  public StatisticsDto statistics() {
    return service.statistics();
  }

  @GetMapping("/api/admin/activity")
  @Operation(summary = "System activity feed (latest 50)")
  public List<ActivityDto> activity() {
    return service.activity();
  }

  @GetMapping("/api/admin/reports")
  @Operation(summary = "Enrollment/analytics aggregates")
  public ReportsDto reports() {
    return service.reports();
  }

  @GetMapping("/api/admin/export")
  @Operation(summary = "CSV download (?type=users|grades|enrollments, NEW)")
  public ResponseEntity<byte[]> export(@RequestParam String type) {
    String csv = service.exportCsv(type);
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition
            .attachment().filename(type.toLowerCase() + "-export.csv").build().toString())
        .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
        .body(csv.getBytes(StandardCharsets.UTF_8));
  }

  @GetMapping("/api/admin/settings")
  @Operation(summary = "Platform settings (NEW)")
  public Map<String, Object> settings() {
    return service.getSettings();
  }

  @PatchMapping("/api/admin/settings")
  @Operation(summary = "Upsert platform settings (NEW)")
  public Map<String, Object> patchSettings(@RequestBody Map<String, Object> patch) {
    return service.patchSettings(patch);
  }

  @PostMapping("/api/admin/wipe")
  @Operation(summary = "Wipe instance data, primary admin survives (ADMIN)")
  public Map<String, Object> wipe() {
    return service.wipeInstance();
  }

  @GetMapping("/api/courses/{id}/student-progress")
  @Operation(summary = "Per-student progress/score/attendance/risk (owner/ADMIN, NEW)")
  public List<StudentProgressRow> studentProgress(@PathVariable String id) {
    return service.studentProgress(id);
  }
}
