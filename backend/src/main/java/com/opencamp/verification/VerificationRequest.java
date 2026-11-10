package com.opencamp.verification;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.ZoneOffset;

public record VerificationRequest(
        @NotNull Boolean isOpen,
        @NotNull Boolean isFree,
        @NotNull Boolean campingAllowed,
        Boolean roadAccessible,
        @NotNull Boolean feltSafe,
        Boolean wasClean,
        Boolean wasCrowded,
        @Size(max = 50) String cellSignal,
        Boolean fireBanSignSeen,
        @NotNull LocalDate visitedAt,
        @Size(max = 2000) String notes) {

    /** "Today" is judged in the furthest-ahead time zone, so no user's local today counts as the future. */
    @AssertTrue(message = "visitedAt cannot be in the future")
    boolean isVisitedAtNotFuture() {
        return visitedAt == null || !visitedAt.isAfter(LocalDate.now(ZoneOffset.MAX));
    }
}
