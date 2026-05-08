package com.facturestudio.api.order;

import com.facturestudio.api.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "purchase_orders")
public class PurchaseOrder {
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

  @Column(length = 1200)
  private String clientAddress;

  private String supplierName;

  private String supplierEmail;

  @Column(length = 1200)
  private String supplierAddress;

  private LocalDate orderDate = LocalDate.now();

  @Column(length = 4000)
  private String itemsSummary;

  @Column(nullable = false)
  private BigDecimal amount = BigDecimal.ZERO;

  @Column(length = 1200)
  private String paymentTerms;

  private String validationName;

  private String invoiceNumber;

  @Column(nullable = false)
  private String status = "OPEN";

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  public Long getId() { return id; }
  public AppUser getOwner() { return owner; }
  public void setOwner(AppUser owner) { this.owner = owner; }
  public String getNumber() { return number; }
  public void setNumber(String number) { this.number = number; }
  public String getClientName() { return clientName; }
  public void setClientName(String clientName) { this.clientName = clientName; }
  public String getClientEmail() { return clientEmail; }
  public void setClientEmail(String clientEmail) { this.clientEmail = clientEmail; }
  public String getClientAddress() { return clientAddress; }
  public void setClientAddress(String clientAddress) { this.clientAddress = clientAddress; }
  public String getSupplierName() { return supplierName; }
  public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
  public String getSupplierEmail() { return supplierEmail; }
  public void setSupplierEmail(String supplierEmail) { this.supplierEmail = supplierEmail; }
  public String getSupplierAddress() { return supplierAddress; }
  public void setSupplierAddress(String supplierAddress) { this.supplierAddress = supplierAddress; }
  public LocalDate getOrderDate() { return orderDate; }
  public void setOrderDate(LocalDate orderDate) { this.orderDate = orderDate; }
  public String getItemsSummary() { return itemsSummary; }
  public void setItemsSummary(String itemsSummary) { this.itemsSummary = itemsSummary; }
  public BigDecimal getAmount() { return amount; }
  public void setAmount(BigDecimal amount) { this.amount = amount; }
  public String getPaymentTerms() { return paymentTerms; }
  public void setPaymentTerms(String paymentTerms) { this.paymentTerms = paymentTerms; }
  public String getValidationName() { return validationName; }
  public void setValidationName(String validationName) { this.validationName = validationName; }
  public String getInvoiceNumber() { return invoiceNumber; }
  public void setInvoiceNumber(String invoiceNumber) { this.invoiceNumber = invoiceNumber; }
  public String getStatus() { return status; }
  public void setStatus(String status) { this.status = status; }
  public Instant getCreatedAt() { return createdAt; }
}
