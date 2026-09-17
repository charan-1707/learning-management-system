package com.learnhub.lms.dto.response;

/**
 * Returned by successful register/login calls. Clients store {@code token} and
 * send it as {@code Authorization: Bearer <token>} on subsequent requests.
 */
public record AuthResponse(
        String token,
        String tokenType,
        long expiresInMs,
        UserResponse user
) {
}