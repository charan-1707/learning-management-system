package com.learnhub.lms.course;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** PATCH /api/courses/:id body — every field optional. */
public record CourseUpdateRequest(
    @Size(max = 20) String code,
    @Size(min = 1, max = 200) String name,
    @Size(max = 200) String shortName,
    String description,
    @Size(max = 80) String category,
    @Min(value = 1, message = "credits must be positive") Integer credits,
    @Size(max = 40) String semester,
    @Size(max = 200) String instructorName,
    @Size(max = 20) String accent,
    @Pattern(regexp = "published|draft", message = "status must be published or draft") String status,
    List<String> outcomes,
    @Size(max = 500) String thumbnailUrl) {
}
