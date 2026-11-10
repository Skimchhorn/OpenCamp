package com.opencamp.verification;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "campsite_verifications")
public class Verification {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long campsiteId;
    private Long userId;
    private boolean isOpen;
    private boolean isFree;
    private boolean campingAllowed;
    private Boolean roadAccessible;
    private boolean feltSafe;
    private Boolean wasClean;
    private Boolean wasCrowded;
    private String cellSignal;
    private Boolean fireBanSignSeen;
    private LocalDate visitedAt;
    private String notes;
    @CreationTimestamp private Instant createdAt;

    protected Verification() {}

    Verification(Long campsiteId, Long userId, VerificationRequest r) {
        this.campsiteId = campsiteId;
        this.userId = userId;
        isOpen = r.isOpen();
        isFree = r.isFree();
        campingAllowed = r.campingAllowed();
        roadAccessible = r.roadAccessible();
        feltSafe = r.feltSafe();
        wasClean = r.wasClean();
        wasCrowded = r.wasCrowded();
        cellSignal = r.cellSignal();
        fireBanSignSeen = r.fireBanSignSeen();
        visitedAt = r.visitedAt();
        notes = r.notes();
    }

    public Long getId() { return id; }
    public Long getCampsiteId() { return campsiteId; }
    public Long getUserId() { return userId; }
    public boolean getIsOpen() { return isOpen; }
    public boolean getIsFree() { return isFree; }
    public boolean getCampingAllowed() { return campingAllowed; }
    public Boolean getRoadAccessible() { return roadAccessible; }
    public boolean getFeltSafe() { return feltSafe; }
    public Boolean getWasClean() { return wasClean; }
    public Boolean getWasCrowded() { return wasCrowded; }
    public String getCellSignal() { return cellSignal; }
    public Boolean getFireBanSignSeen() { return fireBanSignSeen; }
    public LocalDate getVisitedAt() { return visitedAt; }
    public String getNotes() { return notes; }
    public Instant getCreatedAt() { return createdAt; }
}
