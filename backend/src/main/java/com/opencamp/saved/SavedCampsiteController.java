package com.opencamp.saved;

import static com.opencamp.common.CurrentUser.*;

import com.opencamp.campsite.Campsite;
import com.opencamp.campsite.CampsiteRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/me/saved-campsites")
public class SavedCampsiteController {

    private final SavedCampsiteRepository saved;
    private final CampsiteRepository campsites;

    public SavedCampsiteController(SavedCampsiteRepository saved, CampsiteRepository campsites) {
        this.saved = saved;
        this.campsites = campsites;
    }

    @GetMapping
    public List<Campsite> list(@AuthenticationPrincipal Jwt jwt) {
        return campsites.findSavedBy(id(jwt)).stream().filter(c -> !c.isHidden()).toList();
    }

    /** Idempotent: saving twice is fine. */
    @PostMapping("/{campsiteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void save(@PathVariable Long campsiteId, @AuthenticationPrincipal Jwt jwt) {
        campsites.findById(campsiteId).filter(c -> !c.isHidden()).orElseThrow(() -> notFound("Campsite"));
        if (!saved.existsByUserIdAndCampsiteId(id(jwt), campsiteId)) {
            saved.save(new SavedCampsite(id(jwt), campsiteId));
        }
    }

    @DeleteMapping("/{campsiteId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unsave(@PathVariable Long campsiteId, @AuthenticationPrincipal Jwt jwt) {
        saved.deleteByUserIdAndCampsiteId(id(jwt), campsiteId);
    }
}
