package com.opencamp.review;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

public record ReviewRequest(
        @NotNull @Min(1) @Max(5) Integer rating,
        @Size(max = 5000) String reviewText,
        @PastOrPresent LocalDate visitedAt,
        @Min(1) @Max(5) Integer roadRating,
        @Min(1) @Max(5) Integer cleanlinessRating,
        @Min(1) @Max(5) Integer safetyRating,
        @Min(1) @Max(5) Integer crowdednessRating) {}
