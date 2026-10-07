package com.learnhub.lms.content;

import jakarta.validation.constraints.NotNull;

import java.util.List;

/** Reorder body: full ordered id list; service rewrites order_index=idx+1. */
public record ReorderRequest(@NotNull(message = "orderedIds is required") List<String> orderedIds) {
}
