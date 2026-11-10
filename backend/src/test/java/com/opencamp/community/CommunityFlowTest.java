package com.opencamp.community;

import static com.opencamp.campsite.CampsiteControllerTest.campsite;
import static com.opencamp.campsite.CampsiteControllerTest.json;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.jayway.jsonpath.JsonPath;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/** Saved sites, reviews, verifications, reports + moderation, photos, filters. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CommunityFlowTest {

    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired jakarta.persistence.EntityManager em;

    String register(String email) throws Exception {
        String body = "{\"email\":\"%s\",\"password\":\"password123\"}".formatted(email);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body));
        return JsonPath.read(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(body))
                .andReturn().getResponse().getContentAsString(), "$.token");
    }

    String admin() throws Exception {
        register("admin@example.com");
        jdbc.update("UPDATE users SET role = 'ADMIN' WHERE email = 'admin@example.com'");
        em.clear(); // the test transaction still caches the USER-role entity
        return register("admin@example.com"); // re-login so the token carries the ADMIN role
    }

    int createSite(String token, String name) throws Exception {
        return JsonPath.read(mvc.perform(json(post("/api/campsites"), token, campsite(name, 49.1, -121.9, "PUBLIC_LAND_DISPERSED")))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
    }

    String auth(String token) { return "Bearer " + token; }

    @Test
    void saveAndUnsave() throws Exception {
        String t = register("saver@example.com");
        int id = createSite(t, "Saved Spot");
        mvc.perform(post("/api/me/saved-campsites/" + id).header("Authorization", auth(t))).andExpect(status().isNoContent());
        mvc.perform(post("/api/me/saved-campsites/" + id).header("Authorization", auth(t))).andExpect(status().isNoContent());
        mvc.perform(get("/api/me/saved-campsites").header("Authorization", auth(t)))
                .andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].name").value("Saved Spot"));
        mvc.perform(delete("/api/me/saved-campsites/" + id).header("Authorization", auth(t))).andExpect(status().isNoContent());
        mvc.perform(get("/api/me/saved-campsites").header("Authorization", auth(t))).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/me/saved-campsites")).andExpect(status().isUnauthorized());
    }

    @Test
    void reviewsMaintainRating() throws Exception {
        String a = register("a@example.com"), b = register("b@example.com");
        int id = createSite(a, "Rated");
        String review = "{\"rating\":%d,\"reviewText\":\"Quiet at night\",\"safetyRating\":4}";
        int reviewId = JsonPath.read(mvc.perform(json(post("/api/campsites/" + id + "/reviews"), a, review.formatted(5)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(), "$.id");
        mvc.perform(json(post("/api/campsites/" + id + "/reviews"), a, review.formatted(4))).andExpect(status().isConflict());
        mvc.perform(json(post("/api/campsites/" + id + "/reviews"), b, review.formatted(2))).andExpect(status().isCreated());
        mvc.perform(json(post("/api/campsites/" + id + "/reviews"), b, review.formatted(9))).andExpect(status().isBadRequest());

        mvc.perform(get("/api/campsites/" + id))
                .andExpect(jsonPath("$.ratingAvg").value(3.5)).andExpect(jsonPath("$.reviewCount").value(2));
        mvc.perform(json(put("/api/reviews/" + reviewId), b, review.formatted(1))).andExpect(status().isForbidden());
        mvc.perform(json(put("/api/reviews/" + reviewId), a, review.formatted(3))).andExpect(status().isOk());
        mvc.perform(get("/api/campsites/" + id)).andExpect(jsonPath("$.ratingAvg").value(2.5));
        mvc.perform(delete("/api/reviews/" + reviewId).header("Authorization", auth(a))).andExpect(status().isNoContent());
        mvc.perform(get("/api/campsites/" + id + "/reviews")).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get("/api/campsites/" + id)).andExpect(jsonPath("$.ratingAvg").value(2.0)).andExpect(jsonPath("$.reviewCount").value(1));
    }

    @Test
    void verificationsDriveStatus() throws Exception {
        String t = register("verifier@example.com");
        int id = createSite(t, "Verified");
        String visit = "{\"isOpen\":%s,\"isFree\":true,\"campingAllowed\":true,\"feltSafe\":true,\"visitedAt\":\"%s\"}";
        LocalDate today = LocalDate.now();

        mvc.perform(json(post("/api/campsites/" + id + "/verifications"), t, visit.formatted(true, today)))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/campsites/" + id)).andExpect(jsonPath("$.status").value("VERIFIED_RECENTLY"))
                .andExpect(jsonPath("$.lastVerifiedAt").exists());
        mvc.perform(get("/api/campsites").param("status", "VERIFIED_RECENTLY"))
                .andExpect(jsonPath("$[?(@.id == %d)]".formatted(id)).exists());

        // An older visit must not override newer information.
        mvc.perform(json(post("/api/campsites/" + id + "/verifications"), t, visit.formatted(false, today.minusDays(10))))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/campsites/" + id)).andExpect(jsonPath("$.status").value("VERIFIED_RECENTLY"));

        mvc.perform(json(post("/api/campsites/" + id + "/verifications"), t, visit.formatted(false, today)))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/campsites/" + id)).andExpect(jsonPath("$.status").value("REPORTED_CLOSED"));
        mvc.perform(get("/api/campsites/" + id + "/verifications")).andExpect(jsonPath("$.length()").value(3));

        mvc.perform(json(post("/api/campsites/" + id + "/verifications"), t, visit.formatted(true, today.plusDays(2))))
                .andExpect(status().isBadRequest()); // future in every time zone
        mvc.perform(json(post("/api/campsites/" + id + "/verifications"), t, visit.formatted(true, java.time.LocalDate.now(java.time.ZoneOffset.MAX))))
                .andExpect(status().isCreated()); // already "today" somewhere
    }

    @Test
    void reportAndModerate() throws Exception {
        String user = register("reporter@example.com");
        String admin = admin();
        int id = createSite(user, "Sketchy");

        mvc.perform(json(post("/api/campsites/" + id + "/reports"), user, "{\"reason\":\"UNSAFE\",\"description\":\"Broken glass\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("OPEN"));
        mvc.perform(get("/api/admin/reports").header("Authorization", auth(user))).andExpect(status().isForbidden());

        String reports = mvc.perform(get("/api/admin/reports").param("status", "OPEN").header("Authorization", auth(admin)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        int reportId = JsonPath.<java.util.List<Integer>>read(reports, "$[?(@.campsiteName == 'Sketchy')].id").get(0);

        mvc.perform(json(patch("/api/admin/campsites/" + id), admin, "{\"status\":\"HIDDEN\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("HIDDEN"));
        mvc.perform(get("/api/campsites/" + id)).andExpect(status().isNotFound());
        mvc.perform(get("/api/campsites/" + id).header("Authorization", auth(admin))).andExpect(status().isOk());
        mvc.perform(get("/api/campsites")).andExpect(jsonPath("$[?(@.id == %d)]".formatted(id)).doesNotExist());

        mvc.perform(json(put("/api/admin/reports/" + reportId + "/resolve"), admin, "{\"status\":\"RESOLVED\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.resolvedAt").exists());
        mvc.perform(get("/api/admin/reports").param("status", "OPEN").header("Authorization", auth(admin)))
                .andExpect(jsonPath("$[?(@.id == %d)]".formatted(reportId)).doesNotExist());
    }

    @Test
    void photoUploadChecksRealType() throws Exception {
        String owner = register("photographer@example.com"), other = register("other-photo@example.com");
        int id = createSite(owner, "Scenic");
        byte[] png = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};

        String created = mvc.perform(multipart("/api/campsites/" + id + "/photos")
                        .file(new MockMultipartFile("file", "view.png", "image/png", png))
                        .param("caption", "Lake view").header("Authorization", auth(owner)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imageUrl").value(org.hamcrest.Matchers.matchesPattern("/uploads/[0-9a-f-]+\\.png")))
                .andReturn().getResponse().getContentAsString();
        int photoId = JsonPath.read(created, "$.id");

        mvc.perform(multipart("/api/campsites/" + id + "/photos")
                        .file(new MockMultipartFile("file", "evil.png", "image/png", "<script>".getBytes()))
                        .header("Authorization", auth(owner)))
                .andExpect(status().isUnsupportedMediaType());
        mvc.perform(get("/api/campsites/" + id + "/photos")).andExpect(jsonPath("$.length()").value(1));
        mvc.perform(get((String) JsonPath.read(created, "$.imageUrl"))).andExpect(status().isOk());
        mvc.perform(delete("/api/photos/" + photoId).header("Authorization", auth(other))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/photos/" + photoId).header("Authorization", auth(owner))).andExpect(status().isNoContent());

        // Deleting the campsite also removes its image files, so they stop being served.
        String kept = mvc.perform(multipart("/api/campsites/" + id + "/photos")
                        .file(new MockMultipartFile("file", "v.png", "image/png", png)).header("Authorization", auth(owner)))
                .andReturn().getResponse().getContentAsString();
        mvc.perform(delete("/api/campsites/" + id).header("Authorization", auth(owner))).andExpect(status().isNoContent());
        mvc.perform(get((String) JsonPath.read(kept, "$.imageUrl"))).andExpect(status().isNotFound());
    }

    @Test
    void filtersByRegionAndAmenity() throws Exception {
        String t = register("filter@example.com");
        int id = createSite(t, "No Toilet Spot"); // fixture: toiletAvailable=false, region Fraser Valley
        mvc.perform(get("/api/campsites").param("toilet", "false").param("region", "fraser"))
                .andExpect(jsonPath("$[?(@.id == %d)]".formatted(id)).exists());
        mvc.perform(get("/api/campsites").param("toilet", "true"))
                .andExpect(jsonPath("$[?(@.id == %d)]".formatted(id)).doesNotExist());
        mvc.perform(get("/api/campsites").param("region", "Kootenay"))
                .andExpect(jsonPath("$[?(@.id == %d)]".formatted(id)).doesNotExist());
    }
}
