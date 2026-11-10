package com.opencamp.campsite;

import com.opencamp.campsite.Campsite.*;
import jakarta.validation.constraints.*;

/** Fields a contributor may set. Status and verification dates are server-controlled. Null booleans mean "unknown". */
public record CampsiteRequest(
        @NotBlank @Size(max = 200) String name,
        @NotBlank @Size(max = 5000) String description,
        @NotNull @DecimalMin("-90") @DecimalMax("90") Double latitude,
        @NotNull @DecimalMin("-180") @DecimalMax("180") Double longitude,
        @NotBlank @Size(max = 100) String region,
        @NotNull RoadCondition roadCondition,
        @NotNull VehicleRequired vehicleRequired,
        @Size(max = 50) String campingType,
        Boolean toiletAvailable,
        Boolean waterAvailable,
        @Size(max = 50) String cellSignal,
        Boolean fireAllowed,
        Boolean parkingAvailable,
        @NotNull LegalStatus legalStatus) {

    @AssertTrue(message = "camping must be allowed or believed allowed; do not submit closed, private or prohibited sites")
    boolean isLegalStatusSubmittable() {
        return legalStatus == null || switch (legalStatus) {
            case NOT_ALLOWED, PRIVATE_PROPERTY, CLOSED -> false;
            default -> true;
        };
    }
}
