package com.opencamp.review;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByCampsiteIdOrderByCreatedAtDesc(Long campsiteId);
    boolean existsByCampsiteIdAndUserId(Long campsiteId, Long userId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(nativeQuery = true, value = """
            UPDATE campsites SET
                rating_avg   = (SELECT avg(rating) FROM campsite_reviews WHERE campsite_id = :campsiteId),
                review_count = (SELECT count(*)    FROM campsite_reviews WHERE campsite_id = :campsiteId)
            WHERE id = :campsiteId
            """)
    void refreshRating(Long campsiteId);
}
