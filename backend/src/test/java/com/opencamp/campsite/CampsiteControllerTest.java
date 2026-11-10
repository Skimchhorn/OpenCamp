package com.opencamp.campsite;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CampsiteControllerTest {

    @Autowired MockMvc mvc;

    static String campsite(String name, double lat, double lng, String legalStatus) {
        return """
            {"name":"%s","description":"Gravel pullout by the creek","latitude":%s,"longitude":%s,
             "region":"Fraser Valley","roadCondition":"GRAVEL","vehicleRequired":"ANY_CAR",
             "toiletAvailable":false,"legalStatus":"%s","status":"VERIFIED_RECENTLY"}
            """.formatted(name, lat, lng, legalStatus);
    }

    String token(String email) throws Exception {
        String json = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\",\"password\":\"password123\"}".formatted(email)))
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(json, "$.token");
    }

    static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder req, String token, String body) {
        return req.header("Authorization", "Bearer " + token).contentType(MediaType.APPLICATION_JSON).content(body);
    }

    @Test
    void crudWithOwnership() throws Exception {
        String owner = token("owner@example.com");
        String other = token("other@example.com");

        String created = mvc.perform(json(post("/api/campsites"), owner, campsite("Tamihi Creek", 49.07, -121.82, "NEEDS_VERIFICATION")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("NEEDS_UPDATE")) // client-sent status is ignored
                .andExpect(jsonPath("$.lastVerifiedAt").doesNotExist())
                .andExpect(jsonPath("$.toiletAvailable").value(false))
                .andReturn().getResponse().getContentAsString();
        int id = JsonPath.read(created, "$.id");

        mvc.perform(get("/api/campsites/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tamihi Creek"));
        mvc.perform(get("/api/campsites")).andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)]".formatted(id)).exists());

        mvc.perform(json(put("/api/campsites/" + id), other, campsite("Hijacked", 49.07, -121.82, "UNKNOWN")))
                .andExpect(status().isForbidden());
        mvc.perform(json(put("/api/campsites/" + id), owner, campsite("Tamihi Creek Rec Site", 49.07, -121.82, "OFFICIAL_FREE_SITE")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tamihi Creek Rec Site"));

        mvc.perform(delete("/api/campsites/" + id).header("Authorization", "Bearer " + other)).andExpect(status().isForbidden());
        mvc.perform(delete("/api/campsites/" + id).header("Authorization", "Bearer " + owner)).andExpect(status().isNoContent());
        mvc.perform(get("/api/campsites/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void rejectsAnonymousAndInvalidSubmissions() throws Exception {
        mvc.perform(post("/api/campsites").contentType(MediaType.APPLICATION_JSON)
                .content(campsite("Anon", 49, -122, "UNKNOWN"))).andExpect(status().isUnauthorized());

        String t = token("bad@example.com");
        mvc.perform(json(post("/api/campsites"), t, campsite("Private", 49, -122, "PRIVATE_PROPERTY")))
                .andExpect(status().isBadRequest());
        mvc.perform(json(post("/api/campsites"), t, campsite("Off planet", 91, -122, "UNKNOWN")))
                .andExpect(status().isBadRequest());
        mvc.perform(json(post("/api/campsites"), t, "{\"name\":\"Missing fields\"}"))
                .andExpect(status().isBadRequest());
    }
}
