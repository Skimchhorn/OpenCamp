package com.opencamp.common;

import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;

/** Reads the caller from the JWT issued by AuthController (subject = user id, "role" claim). */
public final class CurrentUser {

    private CurrentUser() {}

    public static Long id(Jwt jwt) {
        return Long.valueOf(jwt.getSubject());
    }

    public static boolean isAdmin(Jwt jwt) {
        return jwt != null && "ADMIN".equals(jwt.getClaimAsString("role"));
    }

    public static void requireOwnerOrAdmin(Long ownerId, Jwt jwt) {
        if (!ownerId.equals(id(jwt)) && !isAdmin(jwt)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the author or an admin can change this");
        }
    }

    public static ResponseStatusException notFound(String what) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, what + " not found");
    }
}
