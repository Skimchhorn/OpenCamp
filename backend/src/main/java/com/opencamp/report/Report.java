package com.opencamp.report;

import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "campsite_reports")
public class Report {

    public enum Reason { NOT_FREE, PRIVATE_PROPERTY, CAMPING_NOT_ALLOWED, CLOSED, UNSAFE, WRONG_LOCATION, FAKE_LISTING, SPAM, DUPLICATE, INAPPROPRIATE_PHOTO, OTHER }
    public enum Status { OPEN, REVIEWING, RESOLVED, REJECTED }

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long campsiteId;
    private Long reportedBy;
    @Enumerated(EnumType.STRING) private Reason reason;
    private String description;
    @Enumerated(EnumType.STRING) private Status status = Status.OPEN;
    private Long resolvedBy;
    private Instant resolvedAt;
    @CreationTimestamp private Instant createdAt;

    protected Report() {}

    public Report(Long campsiteId, Long reportedBy, Reason reason, String description) {
        this.campsiteId = campsiteId;
        this.reportedBy = reportedBy;
        this.reason = reason;
        this.description = description;
    }

    public void resolve(Status newStatus, Long adminId) {
        status = newStatus;
        boolean closed = newStatus == Status.RESOLVED || newStatus == Status.REJECTED;
        resolvedBy = closed ? adminId : null;
        resolvedAt = closed ? Instant.now() : null;
    }

    public Long getId() { return id; }
    public Long getCampsiteId() { return campsiteId; }
    public Long getReportedBy() { return reportedBy; }
    public Reason getReason() { return reason; }
    public String getDescription() { return description; }
    public Status getStatus() { return status; }
    public Long getResolvedBy() { return resolvedBy; }
    public Instant getResolvedAt() { return resolvedAt; }
    public Instant getCreatedAt() { return createdAt; }
}
