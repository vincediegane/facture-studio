package com.facturestudio.api.admin;

import com.facturestudio.api.user.AppUser;
import com.facturestudio.api.user.Plan;
import com.facturestudio.api.user.Role;
import com.facturestudio.api.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminSeeder implements CommandLineRunner {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final String email;
  private final String password;
  private final String fullName;

  public AdminSeeder(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      @Value("${app.admin.email}") String email,
      @Value("${app.admin.password}") String password,
      @Value("${app.admin.full-name}") String fullName) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.email = email.toLowerCase();
    this.password = password;
    this.fullName = fullName;
  }

  @Override
  public void run(String... args) {
    userRepository.findByEmail(email).ifPresentOrElse(user -> {
      if (user.getRole() != Role.ADMIN) {
        user.setRole(Role.ADMIN);
        user.setPlan(Plan.PREMIUM);
        userRepository.save(user);
      }
    }, () -> {
      AppUser admin = new AppUser();
      admin.setFullName(fullName);
      admin.setEmail(email);
      admin.setPasswordHash(passwordEncoder.encode(password));
      admin.setRole(Role.ADMIN);
      admin.setPlan(Plan.PREMIUM);
      userRepository.save(admin);
    });
  }
}
