package com.learnhub.lms.content;

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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** Modules (plan §9.4). Reads are locked-flagged for unenrolled students. */
@RestController
@Tag(name = "modules", description = "Course modules and ordering")
public class ModuleController {

  private final ContentService content;

  public ModuleController(ContentService content) {
    this.content = content;
  }

  @GetMapping("/api/courses/{id}/modules")
  @Operation(summary = "Modules in orderIndex ASC (+locked when unenrolled)")
  public List<ModuleDto> forCourse(@PathVariable String id) {
    return content.modulesForCourse(id);
  }

  @PostMapping("/api/courses/{id}/modules")
  @Operation(summary = "Append module (owner/ADMIN)")
  public ResponseEntity<ModuleDto> create(@PathVariable String id,
      @Valid @RequestBody ModuleCreateRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(content.createModule(id, req));
  }

  @PutMapping("/api/courses/{id}/modules/reorder")
  @Operation(summary = "Rewrite order_index=idx+1 (owner/ADMIN)")
  public List<ModuleDto> reorder(@PathVariable String id,
      @Valid @RequestBody ReorderRequest req) {
    return content.reorderModules(id, req.orderedIds());
  }

  @PatchMapping("/api/modules/{id}")
  @Operation(summary = "Rename module (owner/ADMIN)")
  public ModuleDto update(@PathVariable String id,
      @Valid @RequestBody ModuleCreateRequest req) {
    return content.updateModule(id, req);
  }

  @DeleteMapping("/api/modules/{id}")
  @Operation(summary = "Delete module, lessons cascade (owner/ADMIN)")
  public Map<String, Object> delete(@PathVariable String id) {
    content.deleteModule(id);
    return Map.of("ok", true);
  }
}
