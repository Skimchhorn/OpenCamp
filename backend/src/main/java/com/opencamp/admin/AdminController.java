package com.opencamp.admin;

import static com.opencamp.common.CurrentUser.*;

import com.opencamp.campsite.Campsite;
import com.opencamp.campsite.CampsiteRepository;
import com.opencamp.report.Report;
import com.opencamp.report.ReportRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** Moderation endpoints; SecurityConfig restricts /api/admin/** to ROLE_ADMIN. */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    public record ResolveRequest(@NotNull Report.Status status) {}
    public record ModerateRequest(Campsite.Status status, Campsite.LegalStatus legalStatus) {}

    private final ReportRepository reports;
    private final CampsiteRepository campsites;

    public AdminController(ReportRepository reports, CampsiteRepository campsites) {
        this.reports = reports;
        this.campsites = campsites;
    }

    @GetMapping("/reports")
    public List<ReportRepository.AdminView> reports(@RequestParam(required = false) Report.Status status) {
        return reports.findForAdmin(status);
    }

    @PutMapping("/reports/{reportId}/resolve")
    @Transactional
    public Report resolve(@PathVariable Long reportId, @Valid @RequestBody ResolveRequest body, @AuthenticationPrincipal Jwt jwt) {
        Report report = reports.findById(reportId).orElseThrow(() -> notFound("Report"));
        report.resolve(body.status(), id(jwt));
        return report;
    }

    /** Change status (e.g. HIDDEN to hide an unsafe listing) and/or legal status. */
    @PatchMapping("/campsites/{campsiteId}")
    @Transactional
    public Campsite moderate(@PathVariable Long campsiteId, @RequestBody ModerateRequest body) {
        Campsite campsite = campsites.findById(campsiteId).orElseThrow(() -> notFound("Campsite"));
        campsite.moderate(body.status(), body.legalStatus());
        return campsite;
    }
}
