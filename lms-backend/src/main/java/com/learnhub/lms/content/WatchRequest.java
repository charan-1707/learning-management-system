package com.learnhub.lms.content;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

/** POST /api/lessons/:id/watch body: video playback heartbeat. */
public record WatchRequest(
    @PositiveOrZero(message = "positionSec must be >= 0") long positionSec,
    @Positive(message = "durationSec must be > 0") long durationSec) {
}
