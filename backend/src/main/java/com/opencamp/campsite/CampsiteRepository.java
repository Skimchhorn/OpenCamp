package com.opencamp.campsite;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CampsiteRepository extends JpaRepository<Campsite, Long> {
    List<Campsite> findTop100ByStatusNotOrderByCreatedAtDesc(Campsite.Status status);
    Optional<Campsite> findByIdAndStatusNot(Long id, Campsite.Status status);
}
