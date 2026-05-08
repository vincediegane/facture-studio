package com.facturestudio.api.order;

import com.facturestudio.api.account.CurrentUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {
  private final PurchaseOrderRepository repository;
  private final CurrentUserService currentUserService;

  public PurchaseOrderController(PurchaseOrderRepository repository, CurrentUserService currentUserService) {
    this.repository = repository;
    this.currentUserService = currentUserService;
  }

  @GetMapping
  public List<PurchaseOrderResponse> list(Principal principal) {
    return repository.findByOwnerOrderByCreatedAtDesc(currentUserService.requireUser(principal)).stream().map(PurchaseOrderResponse::from).toList();
  }

  @PostMapping
  public PurchaseOrderResponse create(@Valid @RequestBody PurchaseOrderRequest request, Principal principal) {
    PurchaseOrder order = new PurchaseOrder();
    order.setOwner(currentUserService.requireUser(principal));
    order.setNumber(request.number());
    order.setClientName(request.clientName());
    order.setClientEmail(request.clientEmail());
    order.setClientAddress(request.clientAddress());
    order.setSupplierName(request.supplierName());
    order.setSupplierEmail(request.supplierEmail());
    order.setSupplierAddress(request.supplierAddress());
    order.setOrderDate(request.orderDate() == null ? LocalDate.now() : request.orderDate());
    order.setItemsSummary(request.itemsSummary());
    order.setAmount(request.amount());
    order.setPaymentTerms(request.paymentTerms());
    order.setValidationName(request.validationName());
    order.setInvoiceNumber(request.invoiceNumber());
    order.setStatus(request.invoiceNumber() == null || request.invoiceNumber().isBlank() ? "VALIDATED" : "INVOICED");
    return PurchaseOrderResponse.from(repository.save(order));
  }

  public record PurchaseOrderRequest(
      @NotBlank String number,
      @NotBlank String clientName,
      String clientEmail,
      String clientAddress,
      String supplierName,
      String supplierEmail,
      String supplierAddress,
      LocalDate orderDate,
      String itemsSummary,
      @NotNull BigDecimal amount,
      String paymentTerms,
      String validationName,
      String invoiceNumber) {}

  public record PurchaseOrderResponse(
      Long id,
      String number,
      String clientName,
      String clientEmail,
      String clientAddress,
      String supplierName,
      String supplierEmail,
      String supplierAddress,
      LocalDate orderDate,
      String itemsSummary,
      BigDecimal amount,
      String paymentTerms,
      String validationName,
      String invoiceNumber,
      String status) {
    static PurchaseOrderResponse from(PurchaseOrder order) {
      return new PurchaseOrderResponse(
          order.getId(),
          order.getNumber(),
          order.getClientName(),
          order.getClientEmail(),
          order.getClientAddress(),
          order.getSupplierName(),
          order.getSupplierEmail(),
          order.getSupplierAddress(),
          order.getOrderDate(),
          order.getItemsSummary(),
          order.getAmount(),
          order.getPaymentTerms(),
          order.getValidationName(),
          order.getInvoiceNumber(),
          order.getStatus());
    }
  }
}
