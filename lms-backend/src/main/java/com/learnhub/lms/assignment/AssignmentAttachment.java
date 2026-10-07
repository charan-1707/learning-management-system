package com.learnhub.lms.assignment;

import jakarta.validation.constraints.Size;

/** One assignment attachment (uploaded file reference). */
public record AssignmentAttachment(String name, Long size, String mime, String url) {
}
