package com.opencamp.report;

import static com.opencamp.common.CurrentUser.*;

import com.opencamp.campsite.CampsiteRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
public class ReportController {

    public record ReportRequest(@NotNull Report.Reason reason, @Size(max = 2000) String description) {}

    private final ReportRepository reports;
    private final CampsiteRepository campsites;

    public ReportController(ReportRepository reports, CampsiteRepository campsites) {
        this.reports = reports;
        this.campsites = campsites;
    }

    // shortcut: no rate limit on reports (README §16 "later"), add one before public launch.
    @PostMapping("/api/campsites/{campsiteId}/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public Report create(@PathVariable Long campsiteId, @Valid @RequestBody ReportRequest body, @AuthenticationPrincipal Jwt jwt) {
        campsites.findById(campsiteId).orElseThrow(() -> notFound("Campsite"));
        return reports.save(new Report(campsiteId, id(jwt), body.reason(), body.description()));
    }
}
