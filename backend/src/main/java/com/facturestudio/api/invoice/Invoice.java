package com.facturestudio.api.invoice;

import com.facturestudio.api.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "invoices")
public class Invoice {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  private AppUser owner;

  @Column(nullable = false)
  private String number;

  @Column(nullable = false)
  private String clientName;

  private String clientEmail;

  @Column(nullable = false)
  private BigDecimal total = BigDecimal.ZERO;

  @Column(nullable = false)
  private String currency = "FCFA";

  private String templateName;

  private LocalDate dueDate;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private InvoiceStatus status = InvoiceStatus.DRAFT;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  public Long getId() {
    return id;
  }

  public AppUser getOwner() {
    return owner;
  }

  public void setOwner(AppUser owner) {
    this.owner = owner;
  }

  public String getNumber() {
    return number;
  }

  public void setNumber(String number) {
    this.number = number;
  }

  public String getClientName() {
    return clientName;
  }

  public void setClientName(String clientName) {
    this.clientName = clientName;
  }

  public String getClientEmail() {
    return clientEmail;
  }

  public void setClientEmail(String clientEmail) {
    this.clientEmail = clientEmail;
  }

  public BigDecimal getTotal() {
    return total;
  }

  public void setTotal(BigDecimal total) {
    this.total = total;
  }

  public String getCurrency() {
    return currency;
  }

  public void setCurrency(String currency) {
    this.currency = currency;
  }

  public String getTemplateName() {
    return templateName;
  }

  public void setTemplateName(String templateName) {
    this.templateName = templateName;
  }

  public LocalDate getDueDate() {
    return dueDate;
  }

  public void setDueDate(LocalDate dueDate) {
    this.dueDate = dueDate;
  }

  public InvoiceStatus getStatus() {
    return status;
  }

  public void setStatus(InvoiceStatus status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }
}
