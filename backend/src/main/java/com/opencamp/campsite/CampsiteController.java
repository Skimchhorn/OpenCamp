package com.opencamp.campsite;

import static com.opencamp.campsite.Campsite.Status.HIDDEN;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/campsites")
public class CampsiteController {

    private final CampsiteRepository campsites;

    public CampsiteController(CampsiteRepository campsites) {
        this.campsites = campsites;
    }

    /** With lat+lng: sites within radiusKm, nearest first. Without: newest sites. Capped at 100 either way. */
    @GetMapping
    public List<Campsite> list(@RequestParam(required = false) @DecimalMin("-90") @DecimalMax("90") Double lat,
                               @RequestParam(required = false) @DecimalMin("-180") @DecimalMax("180") Double lng,
                               @RequestParam(defaultValue = "50") @Positive @Max(500) double radiusKm) {
        if (lat == null && lng == null) {
            return campsites.findTop100ByStatusNotOrderByCreatedAtDesc(HIDDEN);
        }
        if (lat == null || lng == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lat and lng must be given together");
        }
        return campsites.findNearby(lat, lng, radiusKm * 1000);
    }

    @GetMapping("/{id}")
    public Campsite get(@PathVariable Long id) {
        return campsites.findByIdAndStatusNot(id, HIDDEN).orElseThrow(CampsiteController::notFound);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Campsite create(@Valid @RequestBody CampsiteRequest body, @AuthenticationPrincipal Jwt jwt) {
        Campsite campsite = new Campsite(Long.valueOf(jwt.getSubject()));
        campsite.apply(body);
        return campsites.save(campsite);
    }

    @PutMapping("/{id}")
    @Transactional
    public Campsite update(@PathVariable Long id, @Valid @RequestBody CampsiteRequest body, @AuthenticationPrincipal Jwt jwt) {
        Campsite campsite = editable(id, jwt);
        campsite.apply(body);
        return campsites.saveAndFlush(campsite);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        campsites.delete(editable(id, jwt));
    }

    private Campsite editable(Long id, Jwt jwt) {
        Campsite campsite = campsites.findById(id).orElseThrow(CampsiteController::notFound);
        boolean owner = campsite.getCreatedBy().equals(Long.valueOf(jwt.getSubject()));
        if (!owner && !"ADMIN".equals(jwt.getClaimAsString("role"))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the creator or an admin can change this campsite");
        }
        return campsite;
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Campsite not found");
    }
}
