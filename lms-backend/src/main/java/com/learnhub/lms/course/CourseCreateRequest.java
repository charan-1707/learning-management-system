package com.learnhub.lms.course;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/** POST /api/courses body. New courses default to {@code draft} (plan §8). */
public record CourseCreateRequest(
    @Size(max = 20) String code,
    @NotBlank(message = "name is required") @Size(max = 200) String name,
    @Size(max = 200) String shortName,
    String description,
    @Size(max = 80) String category,
    @Min(value = 1, message = "credits must be positive") Integer credits,
    @Size(max = 40) String semester,
    @Pattern(regexp = "published|draft", message = "status must be published or draft") String status,
    List<String> outcomes,
    @Size(max = 500) String thumbnailUrl) {
}
