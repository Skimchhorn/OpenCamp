package com.opencamp.campsite;

import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "campsites")
public class Campsite {

    public enum RoadCondition { PAVED, GRAVEL, ROUGH_GRAVEL, DIRT, MUDDY, FOUR_BY_FOUR_ONLY, UNKNOWN }
    public enum VehicleRequired { ANY_CAR, SUV_RECOMMENDED, FOUR_BY_FOUR_REQUIRED, WALK_IN_ONLY, UNKNOWN }
    public enum LegalStatus { OFFICIAL_FREE_SITE, PUBLIC_LAND_DISPERSED, NEEDS_VERIFICATION, UNKNOWN, NOT_ALLOWED, PRIVATE_PROPERTY, CLOSED }
    public enum Status { VERIFIED_RECENTLY, NEEDS_UPDATE, REPORTED_CLOSED, REPORTED_UNSAFE, REPORTED_ILLEGAL, HIDDEN }

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
    public Status getStatus() { return status; }
    public Long getCreatedBy() { return createdBy; }
    public Instant getLastVerifiedAt() { return lastVerifiedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
