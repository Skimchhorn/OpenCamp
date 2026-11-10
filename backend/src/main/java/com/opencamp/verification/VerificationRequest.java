package com.opencamp.verification;

import jakarta.validation.constraints.*;
import java.time.LocalDate;

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
        @NotNull @PastOrPresent LocalDate visitedAt,
        @Size(max = 2000) String notes) {}
