package com.facturestudio.api.security;

import com.facturestudio.api.user.AppUser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final SecretKey key;
  private final long expirationMinutes;

  public JwtService(
      @Value("${app.jwt.secret}") String secret,
      @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
    this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    this.expirationMinutes = expirationMinutes;
  }

  public String createToken(AppUser user) {
    Instant now = Instant.now();
    return Jwts.builder()
        .subject(user.getEmail())
        .claim("userId", user.getId())
        .claim("plan", user.getPlan().name())
        .issuedAt(Date.from(now))
        .expiration(Date.from(now.plusSeconds(expirationMinutes * 60)))
        .signWith(key)
        .compact();
  }

  public String extractEmail(String token) {
    return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();
  }
}
