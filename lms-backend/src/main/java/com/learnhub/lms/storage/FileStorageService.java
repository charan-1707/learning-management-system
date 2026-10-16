package com.learnhub.lms.storage;

import com.learnhub.lms.common.ApiException;
import com.learnhub.lms.common.Authz;
import com.learnhub.lms.course.CourseRepository;
import com.learnhub.lms.enrollment.EnrollmentRepository;
import com.learnhub.lms.user.UserRepository;
import com.learnhub.lms.user.Role;
import com.learnhub.lms.user.User;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * File store (plan §9.11). Bytes live in the database ({@code stored_files.data}
 * LONGBLOB) so uploads survive host restarts — local disk is ephemeral on PaaS
 * hosts. Rows predating the DB move still resolve via their {@code path}.
 */
@Service
public class FileStorageService {

  private static final long MAX_BYTES = 10L * 1024 * 1024;
  private static final Set<String> ALLOWED_MIME = Set.of("application/pdf", "video/mp4",
      "application/zip");
  private static final Set<String> ALLOWED_IMAGE_PREFIX = Set.of("image/");
  private static final Set<String> ALLOWED_EXT = Set.of("pdf", "mp4", "png", "jpg", "jpeg",
      "gif", "webp", "zip");

  private final StoredFileRepository files;
  private final EnrollmentRepository enrollments;
  private final CourseRepository courses;
  private final UserRepository users;
  private final Authz authz;
  private final Path root;

  public FileStorageService(StoredFileRepository files, EnrollmentRepository enrollments,
      CourseRepository courses, UserRepository users,
      Authz authz, @Value("${app.uploads-dir:./uploads}") String uploadsDir) throws IOException {
    this.files = files;
    this.enrollments = enrollments;
    this.courses = courses;
    this.users = users;
    this.authz = authz;
    this.root = Paths.get(uploadsDir).toAbsolutePath().normalize();
    Files.createDirectories(this.root);
  }

  private static final long AVATAR_MAX_BYTES = 5L * 1024 * 1024;

  @Transactional
  public UploadResponse storeAvatar(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw ApiException.badRequest("File is empty.");
    }
    if (file.getSize() > AVATAR_MAX_BYTES) {
      throw ApiException.badRequest("Image exceeds 5 MB.");
    }
    String mime = file.getContentType() == null ? "" : file.getContentType();
    String original = file.getOriginalFilename() == null ? "avatar" : file.getOriginalFilename();
    String ext = extension(Paths.get(original).getFileName().toString()).toLowerCase(Locale.ROOT);
    boolean image = ALLOWED_IMAGE_PREFIX.stream().anyMatch(mime::startsWith)
        || Set.of("png", "jpg", "jpeg", "gif", "webp").contains(ext);
    if (!image) {
      throw ApiException.badRequest("Avatar must be an image (png, jpg, gif, webp).");
    }
    return store(file);
  }

  @Transactional
  public UploadResponse store(MultipartFile file) {
    User me = authz.currentUser();
    if (file == null || file.isEmpty()) {
      throw ApiException.badRequest("File is empty.");
    }
    if (file.getSize() > MAX_BYTES) {
      throw ApiException.badRequest("File exceeds 10 MB.");
    }
    String original = file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename();
    String clean = Paths.get(original).getFileName().toString().replaceAll("[^A-Za-z0-9._-]", "_");
    String ext = extension(clean).toLowerCase(Locale.ROOT);
    String mime = file.getContentType() == null ? "" : file.getContentType();
    boolean mimeOk = ALLOWED_MIME.contains(mime) || ALLOWED_IMAGE_PREFIX.stream().anyMatch(mime::startsWith);
    if (!mimeOk && !ALLOWED_EXT.contains(ext)) {
      throw ApiException.badRequest("File type not allowed.");
    }
    final byte[] bytes;
    try {
      bytes = file.getBytes();
    } catch (IOException ex) {
      throw ApiException.badRequest("Could not read file.");
    }
    StoredFile row = new StoredFile();
    row.setId(UUID.randomUUID().toString());
    row.setOwnerId(me.getId());
    row.setName(original);
    row.setMime(mime.isBlank() ? "application/octet-stream" : mime);
    row.setSizeBytes((long) bytes.length);
    row.setPath(null);
    row.setData(bytes);
    row.setCreatedAt(java.time.LocalDateTime.now());
    files.save(row);
    return new UploadResponse(row.getId(), "/api/files/" + row.getId(), original,
        (long) bytes.length, row.getMime());
  }

  @Transactional(readOnly = true)
  public StoredFile resolve(String id) {
    User me = authz.currentUser();
    StoredFile row = files.findById(id)
        .orElseThrow(() -> ApiException.notFound("File not found."));
    // Course covers are public catalog data: any signed-in user may load them,
    // including students browsing before enrolling. (Anonymous callers never
    // reach here — SecurityConfig + JwtAuthFilter reject them first.)
    if (courses.findByThumbnailUrl("/api/files/" + id).isPresent()) {
      return row;
    }
    // Profile photos are shown across rosters, cards and headers to any
    // signed-in user (e.g. instructor faces on the student catalog), so an
    // avatar referenced by any account loads for everyone signed in.
    if (users.findByAvatarUrl("/api/files/" + id).isPresent()) {
      return row;
    }
    if (me.getRole() == Role.admin) {
      return row;
    }
    if (row.getOwnerId() != null && row.getOwnerId().equals(me.getId())) {
      return row;
    }
    if (me.getRole() == Role.student && !enrollments.findByStudent_Id(me.getId()).isEmpty()) {
      return row;
    }
    if (me.getRole() == Role.faculty) {
      return row;
    }
    throw ApiException.forbidden("Forbidden");
  }

  public Path pathOf(StoredFile row) {
    return Paths.get(row.getPath());
  }

  private static String extension(String name) {
    int dot = name.lastIndexOf('.');
    return dot < 0 ? "" : name.substring(dot + 1);
  }
}
