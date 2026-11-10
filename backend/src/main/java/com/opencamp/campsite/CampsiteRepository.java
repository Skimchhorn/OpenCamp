package com.opencamp.campsite;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CampsiteRepository extends JpaRepository<Campsite, Long> {
    List<Campsite> findTop100ByStatusNotOrderByCreatedAtDesc(Campsite.Status status);
    @Query(nativeQuery = true, value = """
            SELECT * FROM campsites
            WHERE status <> 'HIDDEN'
              AND ST_DWithin(location_point, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography, :meters)
            ORDER BY location_point <-> ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
            LIMIT 100
            """)
    List<Campsite> findNearby(double lat, double lng, double meters);

    Optional<Campsite> findByIdAndStatusNot(Long id, Campsite.Status status);
}
