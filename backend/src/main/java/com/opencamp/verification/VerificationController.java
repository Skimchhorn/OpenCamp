package com.opencamp.verification;

import static com.opencamp.common.CurrentUser.*;

import com.opencamp.campsite.Campsite;
import com.opencamp.campsite.CampsiteRepository;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/campsites/{campsiteId}/verifications")
public class VerificationController {

    private final VerificationRepository verifications;
    private final CampsiteRepository campsites;

    public VerificationController(VerificationRepository verifications, CampsiteRepository campsites) {
        this.verifications = verifications;
        this.campsites = campsites;
    }

    @GetMapping
    public List<Verification> list(@PathVariable Long campsiteId) {
        return verifications.findByCampsiteIdOrderByVisitedAtDescCreatedAtDesc(campsiteId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public Verification create(@PathVariable Long campsiteId, @Valid @RequestBody VerificationRequest body,
                               @AuthenticationPrincipal Jwt jwt) {
        Campsite campsite = campsites.findById(campsiteId).filter(c -> !c.isHidden())
                .orElseThrow(() -> notFound("Campsite"));
        campsite.recordVisit(body.visitedAt(), body.isOpen(), body.isFree(), body.campingAllowed(), body.feltSafe());
        return verifications.save(new Verification(campsiteId, id(jwt), body));
    }
}
