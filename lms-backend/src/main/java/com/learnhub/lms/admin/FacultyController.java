package com.learnhub.lms.admin;

import com.learnhub.lms.assignment.SubmissionDto;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Faculty live feeds (plan §9.10): grading inbox + activity. */
@RestController
@Tag(name = "faculty", description = "Faculty grading inbox and activity")
public class FacultyController {

  private final FacultyService service;

  public FacultyController(FacultyService service) {
    this.service = service;
  }

  @GetMapping("/api/faculty/me/pending-submissions")
  @Operation(summary = "Ungraded submissions in owned courses")
  public List<SubmissionDto> pending() {
    return service.pendingSubmissions();
  }

  @GetMapping("/api/faculty/me/activity")
  @Operation(summary = "Owned-course activity feed")
  public List<ActivityDto> activity() {
    return service.activity();
  }
}
