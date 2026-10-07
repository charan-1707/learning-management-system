package com.learnhub.lms.storage;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;

/** File upload/download (plan §9.11). */
@RestController
@Tag(name = "files", description = "Uploads and downloads")
public class UploadController {

  private final FileStorageService storage;

  public UploadController(FileStorageService storage) {
    this.storage = storage;
  }

  @PostMapping(value = "/api/uploads", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @Operation(summary = "Upload (pdf/mp4/images/zip, 10 MB max, NEW)")
  public ResponseEntity<UploadResponse> upload(@RequestParam("file") MultipartFile file) {
    return ResponseEntity.status(201).body(storage.store(file));
  }

  @GetMapping("/api/files/{id}")
  @Operation(summary = "Download with ownership check")
  public ResponseEntity<Resource> download(@PathVariable String id) throws IOException {
    StoredFile row = storage.resolve(id);
    byte[] bytes = Files.readAllBytes(storage.pathOf(row));
    MediaType type;
    try {
      type = MediaType.parseMediaType(row.getMime());
    } catch (Exception ex) {
      type = MediaType.APPLICATION_OCTET_STREAM;
    }
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION,
            "inline; filename=\"" + row.getName().replace("\"", "") + "\"")
        .contentLength(bytes.length)
        .contentType(type)
        .body(new ByteArrayResource(bytes));
  }
}
