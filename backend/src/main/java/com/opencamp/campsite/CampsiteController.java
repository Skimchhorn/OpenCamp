package com.opencamp.campsite;

import static com.opencamp.common.CurrentUser.*;

import com.opencamp.upload.Photo;
import com.opencamp.upload.PhotoRepository;
import jakarta.validation.Valid;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import jakarta.validation.constraints.*;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
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
    private final PhotoRepository photos;
    private final Path uploadDir;

    public CampsiteController(CampsiteRepository campsites, PhotoRepository photos,
                              @Value("${opencamp.upload-dir}") Path uploadDir) {
        this.campsites = campsites;
        this.photos = photos;
        this.uploadDir = uploadDir;
    }

    /** With lat+lng: sites within radiusKm, nearest first. Without: newest sites. Capped at 100 either way. */
    @GetMapping
    public List<Campsite> list(@RequestParam(required = false) @DecimalMin("-90") @DecimalMax("90") Double lat,
                               @RequestParam(required = false) @DecimalMin("-180") @DecimalMax("180") Double lng,
                               @RequestParam(defaultValue = "50") @Positive @Max(500) double radiusKm,
                               @RequestParam(required = false) @Size(max = 100) String region,
                               @RequestParam(required = false) Boolean toilet,
                               @RequestParam(required = false) Boolean water,
                               @RequestParam(required = false) Boolean fire,
                               @RequestParam(required = false) Campsite.Status status) {
        if ((lat == null) != (lng == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "lat and lng must be given together");
        }
        String regionFilter = region == null || region.isBlank() ? null : region.trim();
        return campsites.search(lat, lng, radiusKm * 1000, regionFilter, toilet, water, fire,
                status == null ? null : status.name());
    }

    /** Hidden sites are visible to admins only. */
    @GetMapping("/{id}")
    public Campsite get(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        return campsites.findById(id).filter(c -> !c.isHidden() || isAdmin(jwt))
                .orElseThrow(() -> notFound("Campsite"));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Campsite create(@Valid @RequestBody CampsiteRequest body, @AuthenticationPrincipal Jwt jwt) {
        Campsite campsite = new Campsite(id(jwt));
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
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) throws IOException {
        Campsite campsite = editable(id, jwt);
        List<Photo> files = photos.findByCampsiteIdOrderByCreatedAtAsc(id);
        campsites.delete(campsite); // photo rows go with it (ON DELETE CASCADE); remove the files too
        for (Photo photo : files) {
            Files.deleteIfExists(uploadDir.resolve(photo.getPublicId()));
        }
    }

    private Campsite editable(Long id, Jwt jwt) {
        Campsite campsite = campsites.findById(id).orElseThrow(() -> notFound("Campsite"));
        requireOwnerOrAdmin(campsite.getCreatedBy(), jwt);
        return campsite;
    }
}
