package com.opencamp.campsite;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "campsites")
public class Campsite {

    public enum RoadCondition { PAVED, GRAVEL, ROUGH_GRAVEL, DIRT, MUDDY, FOUR_BY_FOUR_ONLY, UNKNOWN }
    public enum VehicleRequired { ANY_CAR, SUV_RECOMMENDED, FOUR_BY_FOUR_REQUIRED, WALK_IN_ONLY, UNKNOWN }
    public enum LegalStatus { OFFICIAL_FREE_SITE, PUBLIC_LAND_DISPERSED, NEEDS_VERIFICATION, UNKNOWN, NOT_ALLOWED, PRIVATE_PROPERTY, CLOSED }
    public enum Status { VERIFIED_RECENTLY, NEEDS_UPDATE, REPORTED_CLOSED, REPORTED_UNSAFE, REPORTED_ILLEGAL, HIDDEN }

    /** A verification older than this no longer counts as recent. Keep in sync with CampsiteRepository.search. */
    public static final Duration VERIFICATION_FRESHNESS = Duration.ofDays(90);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private double latitude;
    private double longitude;
    private String region;
    @Enumerated(EnumType.STRING) private RoadCondition roadCondition;
    @Enumerated(EnumType.STRING) private VehicleRequired vehicleRequired;
    private String campingType;
    private Boolean toiletAvailable;
    private Boolean waterAvailable;
    private String cellSignal;
    private Boolean fireAllowed;
    private Boolean parkingAvailable;
    @Enumerated(EnumType.STRING) private LegalStatus legalStatus;
    // New community submissions start unverified; only verification (later phase) sets VERIFIED_RECENTLY.
    @Enumerated(EnumType.STRING) private Status status = Status.NEEDS_UPDATE;
    @Column(updatable = false) private Long createdBy;
    private Instant lastVerifiedAt;
    // Maintained by ReviewRepository.refreshRating.
    @Column(insertable = false, updatable = false) private Double ratingAvg;
    @Column(insertable = false, updatable = false) private int reviewCount;
    @CreationTimestamp @Column(updatable = false) private Instant createdAt;
    @UpdateTimestamp private Instant updatedAt;

    protected Campsite() {}

    public Campsite(Long createdBy) {
        this.createdBy = createdBy;
    }

    void apply(CampsiteRequest r) {
        name = r.name();
        description = r.description();
        latitude = r.latitude();
        longitude = r.longitude();
        region = r.region();
        roadCondition = r.roadCondition();
        vehicleRequired = r.vehicleRequired();
        campingType = r.campingType();
        toiletAvailable = r.toiletAvailable();
        waterAvailable = r.waterAvailable();
        cellSignal = r.cellSignal();
        fireAllowed = r.fireAllowed();
        parkingAvailable = r.parkingAvailable();
        legalStatus = r.legalStatus();
    }

    /** Updates verification state from a visit, unless a newer visit is already recorded. */
    public void recordVisit(LocalDate visitedOn, boolean open, boolean free, boolean campingAllowed, boolean feltSafe) {
        Instant visited = visitedOn.atStartOfDay(ZoneOffset.UTC).toInstant();
        if (lastVerifiedAt != null && visited.isBefore(lastVerifiedAt)) return;
        lastVerifiedAt = visited;
        if (status == Status.HIDDEN) return; // only an admin un-hides
        if (!open) status = Status.REPORTED_CLOSED;
        else if (!campingAllowed) status = Status.REPORTED_ILLEGAL;
        else if (!feltSafe) status = Status.REPORTED_UNSAFE;
        else if (!free) status = Status.NEEDS_UPDATE; // listing claims free; needs an admin look
        else status = Status.VERIFIED_RECENTLY;
    }

    public void moderate(Status newStatus, LegalStatus newLegalStatus) {
        if (newStatus != null) status = newStatus;
        if (newLegalStatus != null) legalStatus = newLegalStatus;
    }

    @JsonIgnore
    public boolean isHidden() { return status == Status.HIDDEN; }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getDescription() { return description; }
    public double getLatitude() { return latitude; }
    public double getLongitude() { return longitude; }
    public String getRegion() { return region; }
    public RoadCondition getRoadCondition() { return roadCondition; }
    public VehicleRequired getVehicleRequired() { return vehicleRequired; }
    public String getCampingType() { return campingType; }
    public Boolean getToiletAvailable() { return toiletAvailable; }
    public Boolean getWaterAvailable() { return waterAvailable; }
    public String getCellSignal() { return cellSignal; }
    public Boolean getFireAllowed() { return fireAllowed; }
    public Boolean getParkingAvailable() { return parkingAvailable; }
    public LegalStatus getLegalStatus() { return legalStatus; }
    /** Status as shown to users: a stale "verified recently" reads as needing an update. */
    public Status getStatus() {
        boolean stale = lastVerifiedAt == null || lastVerifiedAt.isBefore(Instant.now().minus(VERIFICATION_FRESHNESS));
        return status == Status.VERIFIED_RECENTLY && stale ? Status.NEEDS_UPDATE : status;
    }
    public Long getCreatedBy() { return createdBy; }
    public Instant getLastVerifiedAt() { return lastVerifiedAt; }
    public Double getRatingAvg() { return ratingAvg; }
    public int getReviewCount() { return reviewCount; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
