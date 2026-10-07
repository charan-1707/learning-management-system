package com.learnhub.lms.attendance;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

/** Attendance (plan §9.8): student aggregates + faculty take-session. */
@RestController
@Tag(name = "attendance", description = "Attendance aggregates and sessions")
public class AttendanceController {

  private final AttendanceService service;

  public AttendanceController(AttendanceService service) {
    this.service = service;
  }

  @GetMapping("/api/students/me/attendance")
  @Operation(summary = "Own per-course present/total (self)")
  public List<CourseAttendanceDto> mine() {
    return service.myAttendance();
  }

  @GetMapping("/api/students/me/attendance/overall")
  @Operation(summary = "Own overall {present,total,percent,courses} (self)")
  public OverallAttendanceDto overall() {
    return service.overall();
  }

  @GetMapping("/api/students/me/attendance/history")
  @Operation(summary = "Own weekly log (self)")
  public List<AttendanceHistoryRow> history() {
    return service.history();
  }

  @PostMapping("/api/courses/{id}/attendance/sessions")
  @Operation(summary = "Take session, upsert per date (owner/ADMIN, NEW)")
  public ResponseEntity<SessionDto> take(@PathVariable String id,
      @Valid @RequestBody SessionCreateRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED)
        .body(service.takeSession(id, req));
  }

  @GetMapping("/api/courses/{id}/attendance/sessions")
  @Operation(summary = "One session with records by date (owner/ADMIN, NEW)")
  public SessionDto sessionByDate(@PathVariable String id,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
    return service.sessionByDate(id, date);
  }

  @GetMapping("/api/courses/{id}/attendance")
  @Operation(summary = "Roster sheet + averages (owner/ADMIN, NEW)")
  public ClassAttendanceDto classView(@PathVariable String id) {
    return service.classView(id);
  }
}
