package com.facturestudio.api.user;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "users")
public class AppUser {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String fullName;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Plan plan = Plan.FREE;

  @Enumerated(EnumType.STRING)
  @Column
  private Role role = Role.USER;

  @Column(nullable = false)
  private int monthlyExportCount = 0;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  public Long getId() {
    return id;
  }

  public String getFullName() {
    return fullName;
  }

  public void setFullName(String fullName) {
    this.fullName = fullName;
  }

  public String getEmail() {
    return email;
  }

  public void setEmail(String email) {
    this.email = email;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public Plan getPlan() {
    return plan;
  }

  public void setPlan(Plan plan) {
    this.plan = plan;
  }

  public Role getRole() {
    return role == null ? Role.USER : role;
  }

  public void setRole(Role role) {
    this.role = role;
  }

  public int getMonthlyExportCount() {
    return monthlyExportCount;
  }

  public void setMonthlyExportCount(int monthlyExportCount) {
    this.monthlyExportCount = monthlyExportCount;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
