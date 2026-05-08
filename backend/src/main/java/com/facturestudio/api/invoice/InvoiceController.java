package com.facturestudio.api.invoice;

import com.facturestudio.api.account.CurrentUserService;
import com.facturestudio.api.user.AppUser;
import com.facturestudio.api.user.Plan;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.security.Principal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/invoices")
public class InvoiceController {
  private final InvoiceRepository invoiceRepository;
  private final CurrentUserService currentUserService;
  private final int freeExportLimit;

  public InvoiceController(
      InvoiceRepository invoiceRepository,
      CurrentUserService currentUserService,
      @Value("${app.quotas.free-export-limit}") int freeExportLimit) {
    this.invoiceRepository = invoiceRepository;
    this.currentUserService = currentUserService;
    this.freeExportLimit = freeExportLimit;
  }

  @GetMapping
  public List<InvoiceResponse> list(Principal principal) {
    return invoiceRepository.findByOwnerOrderByCreatedAtDesc(currentUserService.requireUser(principal)).stream()
        .map(InvoiceResponse::from)
        .toList();
  }

  @PostMapping("/exports")
  @Transactional
  public InvoiceResponse recordExport(@Valid @RequestBody InvoiceRequest request, Principal principal) {
    AppUser user = currentUserService.requireUser(principal);
    if (user.getPlan() == Plan.FREE && user.getMonthlyExportCount() >= freeExportLimit) {
      throw new ResponseStatusException(HttpStatus.PAYMENT_REQUIRED, "Free export limit reached");
    }
    user.setMonthlyExportCount(user.getMonthlyExportCount() + 1);
    Invoice invoice = new Invoice();
    invoice.setOwner(user);
    invoice.setNumber(request.number());
    invoice.setClientName(request.clientName());
    invoice.setClientEmail(request.clientEmail());
    invoice.setTotal(request.total());
    invoice.setCurrency(request.currency());
    invoice.setTemplateName(request.templateName());
    invoice.setDueDate(request.dueDate());
    invoice.setStatus(request.dueDate() != null && request.dueDate().isBefore(LocalDate.now()) ? InvoiceStatus.OVERDUE : InvoiceStatus.SENT);
    return InvoiceResponse.from(invoiceRepository.save(invoice));
  }

  public record InvoiceRequest(
      @NotBlank String number,
      @NotBlank String clientName,
      String clientEmail,
      @NotNull BigDecimal total,
      @NotBlank String currency,
      String templateName,
      LocalDate dueDate) {}

  public record InvoiceResponse(Long id, String number, String clientName, BigDecimal total, String currency, String templateName, LocalDate dueDate, InvoiceStatus status, Instant createdAt) {
    static InvoiceResponse from(Invoice invoice) {
      return new InvoiceResponse(invoice.getId(), invoice.getNumber(), invoice.getClientName(), invoice.getTotal(), invoice.getCurrency(), invoice.getTemplateName(), invoice.getDueDate(), invoice.getStatus(), invoice.getCreatedAt());
    }
  }
}
