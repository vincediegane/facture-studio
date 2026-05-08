package com.facturestudio.api.billing;

import com.facturestudio.api.account.CurrentUserService;
import com.facturestudio.api.user.AppUser;
import com.facturestudio.api.user.Plan;
import com.facturestudio.api.user.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.Principal;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/billing")
public class BillingController {
  private final CurrentUserService currentUserService;
  private final UserRepository userRepository;
  private final RestClient restClient;
  private final String masterKey;
  private final String privateKey;
  private final String token;
  private final String apiBaseUrl;
  private final String storeName;
  private final String successUrl;
  private final String cancelUrl;
  private final String callbackUrl;
  private final int premiumAmount;
  private final int branchesAmount;

  public BillingController(
      CurrentUserService currentUserService,
      UserRepository userRepository,
      RestClient.Builder restClientBuilder,
      @Value("${app.paydunya.master-key:}") String masterKey,
      @Value("${app.paydunya.private-key:}") String privateKey,
      @Value("${app.paydunya.token:}") String token,
      @Value("${app.paydunya.api-base-url:https://app.paydunya.com/sandbox-api/v1}") String apiBaseUrl,
      @Value("${app.paydunya.store-name:Facture Studio}") String storeName,
      @Value("${app.paydunya.success-url:http://localhost:3005?paydunya=success}") String successUrl,
      @Value("${app.paydunya.cancel-url:http://localhost:3005?paydunya=cancel}") String cancelUrl,
      @Value("${app.paydunya.callback-url:http://localhost:8080/api/billing/paydunya/callback}") String callbackUrl,
      @Value("${app.paydunya.amounts.premium:4900}") int premiumAmount,
      @Value("${app.paydunya.amounts.branches:19900}") int branchesAmount) {
    this.currentUserService = currentUserService;
    this.userRepository = userRepository;
    this.restClient = restClientBuilder.build();
    this.masterKey = masterKey;
    this.privateKey = privateKey;
    this.token = token;
    this.apiBaseUrl = apiBaseUrl;
    this.storeName = storeName;
    this.successUrl = successUrl;
    this.cancelUrl = cancelUrl;
    this.callbackUrl = callbackUrl;
    this.premiumAmount = premiumAmount;
    this.branchesAmount = branchesAmount;
  }

  @PostMapping("/premium/mock")
  @Transactional
  public BillingResponse activatePremium(Principal principal) {
    AppUser user = currentUserService.requireUser(principal);
    activatePremium(user, "mock", null, "premium");
    return new BillingResponse(user.getPlan().name(), "Premium activated in mock mode");
  }

  @GetMapping("/subscription")
  public SubscriptionResponse subscription(Principal principal) {
    AppUser user = currentUserService.requireUser(principal);
    return SubscriptionResponse.from(user, paydunyaConfigured());
  }

  @PostMapping("/paydunya/checkout")
  @Transactional
  public CheckoutResponse paydunyaCheckout(@RequestBody CheckoutRequest request, Principal principal) {
    AppUser user = currentUserService.requireUser(principal);
    if (!paydunyaConfigured()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "PayDunya is not configured");
    }

    String plan = normalizedPlan(request.plan());
    int amount = amountFor(plan);
    Map<String, Object> payload = checkoutPayload(user, plan, amount);
    Map<?, ?> response = restClient.post()
        .uri(apiBaseUrl + "/checkout-invoice/create")
        .contentType(MediaType.APPLICATION_JSON)
        .headers(headers -> addPaydunyaHeaders(headers))
        .body(payload)
        .retrieve()
        .body(Map.class);

    if (response == null || !"00".equals(String.valueOf(response.get("response_code")))) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PayDunya checkout creation failed");
    }

    String checkoutUrl = String.valueOf(response.get("response_text"));
    String invoiceToken = String.valueOf(response.get("token"));
    user.setPaymentProvider("PAYDUNYA");
    user.setPaymentToken(invoiceToken);
    user.setPaymentReference(null);
    user.setSubscriptionPlan(plan);
    user.setSubscriptionStatus("pending");
    return new CheckoutResponse(checkoutUrl);
  }

  @GetMapping("/paydunya/return")
  @Transactional
  public BillingResponse paydunyaReturn(@RequestParam("token") String invoiceToken) {
    return confirmPaydunyaInvoice(invoiceToken);
  }

  @GetMapping("/paydunya/cancel")
  @Transactional
  public BillingResponse paydunyaCancel(@RequestParam(value = "token", required = false) String invoiceToken) {
    if (invoiceToken != null) {
      userRepository.findByPaymentToken(invoiceToken).ifPresent(user -> user.setSubscriptionStatus("cancelled"));
    }
    return new BillingResponse("FREE", "PayDunya payment cancelled");
  }

  @PostMapping(value = "/paydunya/callback", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
  @Transactional
  public BillingResponse paydunyaCallback(@RequestBody MultiValueMap<String, String> form) {
    String invoiceToken = firstValue(form, "data[invoice][token]", "invoice[token]", "token");
    if (invoiceToken == null || invoiceToken.isBlank()) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Missing PayDunya invoice token");
    }
    return confirmPaydunyaInvoice(invoiceToken);
  }

  private BillingResponse confirmPaydunyaInvoice(String invoiceToken) {
    if (!paydunyaConfigured()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "PayDunya is not configured");
    }
    Map<?, ?> response = restClient.get()
        .uri(apiBaseUrl + "/checkout-invoice/confirm/" + invoiceToken)
        .headers(headers -> addPaydunyaHeaders(headers))
        .retrieve()
        .body(Map.class);

    if (response == null || !"00".equals(String.valueOf(response.get("response_code")))) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "PayDunya invoice confirmation failed");
    }
    validatePaydunyaHash(String.valueOf(response.get("hash")));
    String status = String.valueOf(response.get("status")).toLowerCase();
    AppUser user = userRepository.findByPaymentToken(invoiceToken)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment owner not found"));
    user.setSubscriptionStatus(status);
    if ("completed".equals(status)) {
      activatePremium(user, "PAYDUNYA", invoiceToken, user.getSubscriptionPlan());
    }
    if ("cancelled".equals(status) || "canceled".equals(status) || "failed".equals(status)) {
      user.setPlan(Plan.FREE);
      user.setSubscriptionCurrentPeriodEnd(Instant.now());
    }
    return new BillingResponse(user.getPlan().name(), "PayDunya payment status: " + status);
  }

  private Map<String, Object> checkoutPayload(AppUser user, String plan, int amount) {
    Map<String, Object> invoice = new LinkedHashMap<>();
    invoice.put("total_amount", amount);
    invoice.put("description", "Abonnement " + displayPlan(plan) + " Facture Studio");
    invoice.put("customer", Map.of(
        "name", user.getFullName(),
        "email", user.getEmail(),
        "phone", ""));
    invoice.put("items", Map.of("item_0", Map.of(
        "name", "Facture Studio " + displayPlan(plan),
        "quantity", 1,
        "unit_price", amount,
        "total_price", amount,
        "description", "Accès aux fonctionnalités premium")));

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("invoice", invoice);
    payload.put("store", Map.of("name", storeName));
    payload.put("custom_data", Map.of("userId", user.getId(), "plan", plan));
    payload.put("actions", Map.of(
        "return_url", successUrl,
        "cancel_url", cancelUrl,
        "callback_url", callbackUrl));
    return payload;
  }

  private void activatePremium(AppUser user, String provider, String reference, String plan) {
    user.setPlan(Plan.PREMIUM);
    user.setPaymentProvider(provider);
    user.setPaymentReference(reference);
    user.setSubscriptionStatus("active");
    user.setSubscriptionPlan(plan == null ? "premium" : plan);
  }

  private void addPaydunyaHeaders(org.springframework.http.HttpHeaders headers) {
    headers.add("PAYDUNYA-MASTER-KEY", masterKey);
    headers.add("PAYDUNYA-PRIVATE-KEY", privateKey);
    headers.add("PAYDUNYA-TOKEN", token);
  }

  private void validatePaydunyaHash(String hash) {
    if (hash == null || hash.isBlank() || !hash.equalsIgnoreCase(sha512(masterKey))) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid PayDunya hash");
    }
  }

  private String sha512(String value) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-512");
      byte[] bytes = digest.digest(value.getBytes(StandardCharsets.UTF_8));
      StringBuilder hex = new StringBuilder();
      for (byte item : bytes) {
        hex.append(String.format("%02x", item));
      }
      return hex.toString();
    } catch (NoSuchAlgorithmException error) {
      throw new IllegalStateException("SHA-512 is not available", error);
    }
  }

  private boolean paydunyaConfigured() {
    return masterKey != null && !masterKey.isBlank()
        && privateKey != null && !privateKey.isBlank()
        && token != null && !token.isBlank();
  }

  private String firstValue(MultiValueMap<String, String> form, String... keys) {
    for (String key : keys) {
      String value = form.getFirst(key);
      if (value != null && !value.isBlank()) return value;
    }
    return null;
  }

  private int amountFor(String plan) {
    return "branches".equals(plan) ? branchesAmount : premiumAmount;
  }

  private String normalizedPlan(String plan) {
    if (plan == null || plan.isBlank()) return "premium";
    return plan.trim().toLowerCase();
  }

  private String displayPlan(String plan) {
    return "branches".equals(plan) ? "Succursales" : "Premium";
  }

  public record BillingResponse(String plan, String message) {}
  public record CheckoutRequest(String plan, String paymentMethod) {}
  public record CheckoutResponse(String checkoutUrl) {}
  public record SubscriptionResponse(String plan, String subscriptionPlan, String status, Instant currentPeriodEnd, boolean paydunyaConfigured) {
    static SubscriptionResponse from(AppUser user, boolean paydunyaConfigured) {
      return new SubscriptionResponse(
          user.getPlan().name(),
          user.getSubscriptionPlan(),
          user.getSubscriptionStatus(),
          user.getSubscriptionCurrentPeriodEnd(),
          paydunyaConfigured);
    }
  }
}
