package com.opencamp.verification;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VerificationRepository extends JpaRepository<Verification, Long> {
    List<Verification> findByCampsiteIdOrderByVisitedAtDescCreatedAtDesc(Long campsiteId);
}
