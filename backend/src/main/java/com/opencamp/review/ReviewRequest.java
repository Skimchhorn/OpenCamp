package com.opencamp.review;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.ZoneOffset;

public record ReviewRequest(
        @NotNull @Min(1) @Max(5) Integer rating,
        @Size(max = 5000) String reviewText,
        LocalDate visitedAt,
        @Min(1) @Max(5) Integer roadRating,
        @Min(1) @Max(5) Integer cleanlinessRating,
        @Min(1) @Max(5) Integer safetyRating,
        @Min(1) @Max(5) Integer crowdednessRating) {

    /** "Today" is judged in the furthest-ahead time zone, so no user's local today counts as the future. */
    @AssertTrue(message = "visitedAt cannot be in the future")
    boolean isVisitedAtNotFuture() {
        return visitedAt == null || !visitedAt.isAfter(LocalDate.now(ZoneOffset.MAX));
    }
}
