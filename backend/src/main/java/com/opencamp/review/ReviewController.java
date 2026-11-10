package com.opencamp.review;

import static com.opencamp.common.CurrentUser.*;

import com.opencamp.campsite.CampsiteRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api")
public class ReviewController {

    private final ReviewRepository reviews;
    private final CampsiteRepository campsites;

    public ReviewController(ReviewRepository reviews, CampsiteRepository campsites) {
        this.reviews = reviews;
        this.campsites = campsites;
    }

    @GetMapping("/campsites/{campsiteId}/reviews")
    public List<Review> list(@PathVariable Long campsiteId) {
        return reviews.findByCampsiteIdOrderByCreatedAtDesc(campsiteId);
    }

    @PostMapping("/campsites/{campsiteId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Review create(@PathVariable Long campsiteId, @Valid @RequestBody ReviewRequest body, @AuthenticationPrincipal Jwt jwt) {
        campsites.findById(campsiteId).filter(c -> !c.isHidden()).orElseThrow(() -> notFound("Campsite"));
        if (reviews.existsByCampsiteIdAndUserId(campsiteId, id(jwt))) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already reviewed this campsite; edit your review instead");
        }
        Review review = new Review(campsiteId, id(jwt));
        review.apply(body);
        review = reviews.save(review);
        reviews.refreshRating(campsiteId);
        return review;
    }

    @PutMapping("/reviews/{reviewId}")
    @Transactional
    public Review update(@PathVariable Long reviewId, @Valid @RequestBody ReviewRequest body, @AuthenticationPrincipal Jwt jwt) {
        Review review = editable(reviewId, jwt);
        review.apply(body);
        review = reviews.saveAndFlush(review);
        reviews.refreshRating(review.getCampsiteId());
        return review;
    }

    @DeleteMapping("/reviews/{reviewId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long reviewId, @AuthenticationPrincipal Jwt jwt) {
        Review review = editable(reviewId, jwt);
        reviews.delete(review);
        reviews.refreshRating(review.getCampsiteId());
    }

    private Review editable(Long reviewId, Jwt jwt) {
        Review review = reviews.findById(reviewId).orElseThrow(() -> notFound("Review"));
        requireOwnerOrAdmin(review.getUserId(), jwt);
        return review;
    }
}
