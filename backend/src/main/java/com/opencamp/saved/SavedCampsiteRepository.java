package com.opencamp.saved;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

public interface SavedCampsiteRepository extends JpaRepository<SavedCampsite, Long> {
    boolean existsByUserIdAndCampsiteId(Long userId, Long campsiteId);

    @Transactional
    long deleteByUserIdAndCampsiteId(Long userId, Long campsiteId);
}
