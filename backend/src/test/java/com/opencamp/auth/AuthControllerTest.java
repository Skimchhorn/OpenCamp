package com.opencamp.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerTest {

    @Autowired MockMvc mvc;

    private String body(String email, String password) {
        return "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password);
    }

    @Test
    void registerLoginAndMe() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(body("Camper@Example.com", "password123")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString());

        String json = mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content(body("camper@example.com", "password123")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        String token = JsonPath.read(json, "$.token");

        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("camper@example.com"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void rejectsDuplicateEmailBadPasswordAndMissingToken() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(body("dup@example.com", "password123"))).andExpect(status().isCreated());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(body("DUP@example.com", "password123"))).andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Email already registered"));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content(body("dup@example.com", "wrongpass1"))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(body("not-an-email", "short"))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer garbage")).andExpect(status().isUnauthorized());
    }
}
