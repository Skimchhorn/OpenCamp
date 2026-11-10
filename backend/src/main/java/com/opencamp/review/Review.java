package com.opencamp.review;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "campsite_reviews")
public class Review {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(updatable = false) private Long campsiteId;
    @Column(updatable = false) private Long userId;
    private int rating;
    private String reviewText;
    private LocalDate visitedAt;
    private Integer roadRating;
    private Integer cleanlinessRating;
    private Integer safetyRating;
    private Integer crowdednessRating;
    @CreationTimestamp @Column(updatable = false) private Instant createdAt;
    @UpdateTimestamp private Instant updatedAt;

    protected Review() {}

    public Review(Long campsiteId, Long userId) {
        this.campsiteId = campsiteId;
        this.userId = userId;
    }

    void apply(ReviewRequest r) {
        rating = r.rating();
        reviewText = r.reviewText();
        visitedAt = r.visitedAt();
        roadRating = r.roadRating();
        cleanlinessRating = r.cleanlinessRating();
        safetyRating = r.safetyRating();
        crowdednessRating = r.crowdednessRating();
    }

    public Long getId() { return id; }
    public Long getCampsiteId() { return campsiteId; }
    public Long getUserId() { return userId; }
    public int getRating() { return rating; }
    public String getReviewText() { return reviewText; }
    public LocalDate getVisitedAt() { return visitedAt; }
    public Integer getRoadRating() { return roadRating; }
    public Integer getCleanlinessRating() { return cleanlinessRating; }
    public Integer getSafetyRating() { return safetyRating; }
    public Integer getCrowdednessRating() { return crowdednessRating; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
