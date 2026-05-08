package com.facturestudio.api.admin;

import com.facturestudio.api.catalog.CatalogRepository;
import com.facturestudio.api.customer.Customer;
import com.facturestudio.api.customer.CustomerRepository;
import com.facturestudio.api.invoice.Invoice;
import com.facturestudio.api.invoice.InvoiceRepository;
import com.facturestudio.api.order.PurchaseOrder;
import com.facturestudio.api.order.PurchaseOrderRepository;
import com.facturestudio.api.user.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
  private final UserRepository users;
  private final CustomerRepository customers;
  private final CatalogRepository catalog;
  private final InvoiceRepository invoices;
  private final PurchaseOrderRepository purchaseOrders;

  public AdminController(
      UserRepository users,
      CustomerRepository customers,
      CatalogRepository catalog,
      InvoiceRepository invoices,
      PurchaseOrderRepository purchaseOrders) {
    this.users = users;
    this.customers = customers;
    this.catalog = catalog;
    this.invoices = invoices;
    this.purchaseOrders = purchaseOrders;
  }

  @GetMapping("/stats")
  @PreAuthorize("hasRole('ADMIN')")
  public AdminStats stats() {
    return new AdminStats(users.count(), customers.count(), catalog.count(), invoices.count(), purchaseOrders.count());
  }

  @GetMapping("/customers")
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional(readOnly = true)
  public List<AdminCustomerDto> customers() {
    return customers.findAll().stream()
        .sorted(Comparator.comparing(Customer::getName, String.CASE_INSENSITIVE_ORDER))
        .map(AdminCustomerDto::from)
        .toList();
  }

  @GetMapping("/invoices")
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional(readOnly = true)
  public List<AdminInvoiceDto> invoices() {
    return invoices.findAllByOrderByCreatedAtDesc().stream()
        .map(AdminInvoiceDto::from)
        .toList();
  }

  @GetMapping("/purchase-orders")
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional(readOnly = true)
  public List<AdminPurchaseOrderDto> purchaseOrders() {
    return purchaseOrders.findAllByOrderByCreatedAtDesc().stream()
        .map(AdminPurchaseOrderDto::from)
        .toList();
  }

  @PutMapping("/purchase-orders/{id}/link")
  @PreAuthorize("hasRole('ADMIN')")
  @Transactional
  public AdminPurchaseOrderDto linkPurchaseOrder(@PathVariable Long id, @RequestBody LinkPurchaseOrderRequest request) {
    PurchaseOrder order = purchaseOrders.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bon de commande introuvable"));
    String invoiceNumber = request.invoiceNumber() == null ? "" : request.invoiceNumber().trim();
    order.setInvoiceNumber(invoiceNumber.isBlank() ? null : invoiceNumber);
    order.setStatus(invoiceNumber.isBlank() ? "VALIDATED" : "INVOICED");
    return AdminPurchaseOrderDto.from(purchaseOrders.save(order));
  }

  public record AdminStats(long users, long customers, long catalogItems, long invoices, long purchaseOrders) {}

  public record LinkPurchaseOrderRequest(String invoiceNumber) {}

  public record AdminCustomerDto(Long id, String ownerEmail, String ownerName, String name, String email, String address) {
    static AdminCustomerDto from(Customer customer) {
      return new AdminCustomerDto(
          customer.getId(),
          customer.getOwner().getEmail(),
          customer.getOwner().getFullName(),
          customer.getName(),
          customer.getEmail(),
          customer.getAddress());
    }
  }

  public record AdminInvoiceDto(
      Long id,
      String ownerEmail,
      String ownerName,
      String number,
      String clientName,
      String clientEmail,
      BigDecimal total,
      String currency,
      String templateName,
      LocalDate dueDate,
      String status,
      Instant createdAt) {
    static AdminInvoiceDto from(Invoice invoice) {
      return new AdminInvoiceDto(
          invoice.getId(),
          invoice.getOwner().getEmail(),
          invoice.getOwner().getFullName(),
          invoice.getNumber(),
          invoice.getClientName(),
          invoice.getClientEmail(),
          invoice.getTotal(),
          invoice.getCurrency(),
          invoice.getTemplateName(),
          invoice.getDueDate(),
          invoice.getStatus().name(),
          invoice.getCreatedAt());
    }
  }

  public record AdminPurchaseOrderDto(
      Long id,
      String ownerEmail,
      String ownerName,
      String number,
      String clientName,
      String supplierName,
      LocalDate orderDate,
      String itemsSummary,
      BigDecimal amount,
      String paymentTerms,
      String validationName,
      String invoiceNumber,
      String status,
      Instant createdAt) {
    static AdminPurchaseOrderDto from(PurchaseOrder order) {
      return new AdminPurchaseOrderDto(
          order.getId(),
          order.getOwner().getEmail(),
          order.getOwner().getFullName(),
          order.getNumber(),
          order.getClientName(),
          order.getSupplierName(),
          order.getOrderDate(),
          order.getItemsSummary(),
          order.getAmount(),
          order.getPaymentTerms(),
          order.getValidationName(),
          order.getInvoiceNumber(),
          order.getStatus(),
          order.getCreatedAt());
    }
  }
}
