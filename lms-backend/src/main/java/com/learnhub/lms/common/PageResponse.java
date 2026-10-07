package com.learnhub.lms.common;

import java.util.List;

/**
 * Pagination envelope for list endpoints (plan §13.3).
 * Controllers also send the {@code X-Total-Count} header the frontend expects.
 */
public record PageResponse<T>(List<T> data, long total, int page, int size) {
}
