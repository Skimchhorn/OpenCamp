package com.opencamp.auth;

import com.opencamp.user.User;
import com.opencamp.user.UserRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    public record Credentials(@NotBlank @Email @Size(max = 255) String email,
                              @NotBlank @Size(min = 8, max = 72) String password) {}
    public record TokenResponse(String token) {}
    public record Me(Long id, String email, String role) {}

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtEncoder jwtEncoder;
    private final Duration ttl;

    public AuthController(UserRepository users, PasswordEncoder passwordEncoder, JwtEncoder jwtEncoder,
                          @Value("${opencamp.jwt.ttl}") Duration ttl) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtEncoder = jwtEncoder;
        this.ttl = ttl;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public TokenResponse register(@Valid @RequestBody Credentials body) {
        String email = normalize(body.email());
        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User user = users.save(new User(email, passwordEncoder.encode(body.password())));
        return new TokenResponse(issueToken(user));
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody Credentials body) {
        return users.findByEmail(normalize(body.email()))
                .filter(u -> passwordEncoder.matches(body.password(), u.getPasswordHash()))
                .map(u -> new TokenResponse(issueToken(u)))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
    }

    @GetMapping("/me")
    public Me me(@AuthenticationPrincipal Jwt jwt) {
        User user = users.findById(Long.valueOf(jwt.getSubject()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        return new Me(user.getId(), user.getEmail(), user.getRole().name());
    }

    private String issueToken(User user) {
        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(user.getId().toString())
                .issuedAt(now)
                .expiresAt(now.plus(ttl))
                .claim("role", user.getRole().name())
                .build();
        return jwtEncoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();
    }

    private static String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
