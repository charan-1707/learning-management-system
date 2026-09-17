package com.learnhub.lms.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Small accessor helpers for the currently authenticated principal.
 * Returns {@code null}/{-1L} when the request is anonymous.
 */
public final class SecurityUtils {

    private SecurityUtils() {
    }

    public static UserPrincipal currentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return principal;
        }
        return null;
    }

    public static Long currentUserId() {
        UserPrincipal principal = currentUser();
        return principal == null ? null : principal.getId();
    }
}