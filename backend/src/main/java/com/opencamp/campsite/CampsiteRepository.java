package com.opencamp.campsite;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CampsiteRepository extends JpaRepository<Campsite, Long> {

    /** Every filter is optional (null = ignore). With lat/lng: within meters, nearest first; otherwise newest first. */
    @Query(nativeQuery = true, value = """
            SELECT * FROM campsites c
            WHERE c.status <> 'HIDDEN'
              AND (CAST(:lat AS float8) IS NULL OR ST_DWithin(c.location_point,
                   ST_SetSRID(ST_MakePoint(CAST(:lng AS float8), CAST(:lat AS float8)), 4326)::geography, :meters))
              AND (CAST(:region AS text) IS NULL OR c.region ILIKE '%' || CAST(:region AS text) || '%')
              AND (CAST(:toilet AS boolean) IS NULL OR c.toilet_available = CAST(:toilet AS boolean))
              AND (CAST(:water AS boolean) IS NULL OR c.water_available = CAST(:water AS boolean))
              AND (CAST(:fire AS boolean) IS NULL OR c.fire_allowed = CAST(:fire AS boolean))
              AND (CAST(:status AS text) IS NULL OR CAST(:status AS text) =
                   CASE WHEN c.status = 'VERIFIED_RECENTLY'
                             AND (c.last_verified_at IS NULL OR c.last_verified_at < now() - interval '90 days')
                        THEN 'NEEDS_UPDATE' ELSE c.status END)
            ORDER BY CASE WHEN CAST(:lat AS float8) IS NULL THEN 0 ELSE ST_Distance(c.location_point,
                     ST_SetSRID(ST_MakePoint(CAST(:lng AS float8), CAST(:lat AS float8)), 4326)::geography) END,
                     c.created_at DESC
            LIMIT 100
            """)
    List<Campsite> search(Double lat, Double lng, double meters, String region,
                          Boolean toilet, Boolean water, Boolean fire, String status);

    @Query("select c from Campsite c join SavedCampsite s on s.campsiteId = c.id where s.userId = :userId order by s.createdAt desc")
    List<Campsite> findSavedBy(Long userId);
}
