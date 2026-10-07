package com.learnhub.lms.assignment;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Gradebook + own grades (plan §9.6). */
@RestController
@Tag(name = "grades", description = "Gradebook and student grade views")
public class GradeController {

  private final GradeService service;

  public GradeController(GradeService service) {
    this.service = service;
  }

  @GetMapping("/api/courses/{id}/gradebook")
  @Operation(summary = "Roster x assignments grid (owner/ADMIN)")
  public GradebookDto gradebook(@PathVariable String id) {
    return service.gradebook(id);
  }

  @GetMapping("/api/students/me/grades")
  @Operation(summary = "Own grades (self)")
  public List<GradeDto> mine() {
    return service.myGrades();
  }

  @GetMapping("/api/students/me/grades/summary")
  @Operation(summary = "Own {average,count,best,recent[5]} (self)")
  public GradeSummaryDto summary() {
    return service.summary();
  }
}
