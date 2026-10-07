package com.learnhub.lms.storage;

/** POST /api/uploads result. {@code url} is the authenticated download path. */
public record UploadResponse(String fileId, String url, String name, long size, String mime) {
}
