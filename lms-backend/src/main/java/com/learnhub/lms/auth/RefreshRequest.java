package com.learnhub.lms.auth;

/** POST /api/auth/refresh + POST /api/auth/logout bodies. */
public record RefreshRequest(String refreshToken) {
}
