package com.facturestudio.api.auth;

import com.facturestudio.api.user.Plan;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class AuthDtos {
  public record RegisterRequest(
      @NotBlank String fullName,
      @Email @NotBlank String email,
      @NotBlank String password) {}

  public record LoginRequest(
      @Email @NotBlank String email,
      @NotBlank String password) {}

  public record AuthResponse(
      String token,
      Long userId,
      String fullName,
      String email,
      Plan plan,
      String role,
      int monthlyExportCount,
      int freeExportLimit) {}
}
