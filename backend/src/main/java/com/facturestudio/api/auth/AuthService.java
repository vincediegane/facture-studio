package com.facturestudio.api.auth;

import com.facturestudio.api.auth.AuthDtos.AuthResponse;
import com.facturestudio.api.auth.AuthDtos.LoginRequest;
import com.facturestudio.api.auth.AuthDtos.RegisterRequest;
import com.facturestudio.api.security.JwtService;
import com.facturestudio.api.user.AppUser;
import com.facturestudio.api.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class AuthService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final int freeExportLimit;

  public AuthService(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      JwtService jwtService,
      @Value("${app.quotas.free-export-limit}") int freeExportLimit) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.jwtService = jwtService;
    this.freeExportLimit = freeExportLimit;
  }

  @Transactional
  public AuthResponse register(RegisterRequest request) {
    if (userRepository.existsByEmail(request.email())) {
      throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
    }
    AppUser user = new AppUser();
    user.setFullName(request.fullName());
    user.setEmail(request.email().toLowerCase());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    userRepository.save(user);
    return responseFor(user);
  }

  public AuthResponse login(LoginRequest request) {
    AppUser user = userRepository.findByEmail(request.email().toLowerCase())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
    }
    return responseFor(user);
  }

  public AuthResponse profile(String email) {
    AppUser user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    return responseFor(user);
  }

  private AuthResponse responseFor(AppUser user) {
    return new AuthResponse(
        jwtService.createToken(user),
        user.getId(),
        user.getFullName(),
        user.getEmail(),
        user.getPlan(),
        user.getRole().name(),
        user.getMonthlyExportCount(),
        freeExportLimit);
  }
}
