package com.facturestudio.api.billing;

import com.facturestudio.api.account.CurrentUserService;
import com.facturestudio.api.user.AppUser;
import com.facturestudio.api.user.Plan;
import com.facturestudio.api.user.UserRepository;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import java.security.Principal;
import java.time.Instant;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/billing")
public class BillingController {
  private final CurrentUserService currentUserService;
  private final UserRepository userRepository;
  private final String stripeSecretKey;
  private final String stripeWebhookSecret;
  private final String premiumPriceId;
  private final String branchesPriceId;
  private final String successUrl;
  private final String cancelUrl;

  public BillingController(
      CurrentUserService currentUserService,
      UserRepository userRepository,
      @Value("${app.stripe.secret-key:}") String stripeSecretKey,
      @Value("${app.stripe.webhook-secret:}") String stripeWebhookSecret,
      @Value("${app.stripe.prices.premium:}") String premiumPriceId,
      @Value("${app.stripe.prices.branches:}") String branchesPriceId,
      @Value("${app.stripe.success-url:http://localhost:3005?checkout=success}") String successUrl,
      @Value("${app.stripe.cancel-url:http://localhost:3005?checkout=cancel}") String cancelUrl) {
    this.currentUserService = currentUserService;
    this.userRepository = userRepository;
    this.stripeSecretKey = stripeSecretKey;
    this.stripeWebhookSecret = stripeWebhookSecret;
    this.premiumPriceId = premiumPriceId;
    this.branchesPriceId = branchesPriceId;
    this.successUrl = successUrl;
    this.cancelUrl = cancelUrl;
  }

  @PostMapping("/premium/mock")
  @Transactional
  public BillingResponse activatePremium(Principal principal) {
    AppUser user = currentUserService.requireUser(principal);
    user.setPlan(Plan.PREMIUM);
    return new BillingResponse(user.getPlan().name(), "Premium activated in mock mode");
  }

  @GetMapping("/subscription")
  public SubscriptionResponse subscription(Principal principal) {
    AppUser user = currentUserService.requireUser(principal);
    return SubscriptionResponse.from(user, stripeConfigured());
  }

  @PostMapping("/checkout-session")
  public CheckoutResponse checkout(@RequestBody CheckoutRequest request, Principal principal) {
    AppUser user = currentUserService.requireUser(principal);
    String priceId = priceIdFor(request.plan());
    if (!stripeConfigured() || priceId == null || priceId.isBlank()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Stripe is not configured");
    }
    try {
      Stripe.apiKey = stripeSecretKey;
      SessionCreateParams.Builder params = SessionCreateParams.builder()
          .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
          .setSuccessUrl(successUrl)
          .setCancelUrl(cancelUrl)
          .setClientReferenceId(String.valueOf(user.getId()))
          .setCustomerEmail(user.getEmail())
          .putMetadata("userId", String.valueOf(user.getId()))
          .putMetadata("plan", normalizedPlan(request.plan()))
          .setSubscriptionData(SessionCreateParams.SubscriptionData.builder()
              .putMetadata("userId", String.valueOf(user.getId()))
              .putMetadata("plan", normalizedPlan(request.plan()))
              .build())
          .addLineItem(SessionCreateParams.LineItem.builder()
              .setPrice(priceId)
              .setQuantity(1L)
              .build());
      Session session = Session.create(params.build());
      return new CheckoutResponse(session.getUrl());
    } catch (StripeException error) {
      throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Stripe checkout creation failed", error);
    }
  }

  @PostMapping("/webhook")
  @Transactional
  public WebhookResponse webhook(@RequestBody String payload, @RequestHeader("Stripe-Signature") String signature) {
    if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) {
      throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Stripe webhook is not configured");
    }
    Event event;
    try {
      event = Webhook.constructEvent(payload, signature, stripeWebhookSecret);
    } catch (SignatureVerificationException error) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Stripe signature", error);
    }
    if ("checkout.session.completed".equals(event.getType())) {
      Session session = (Session) event.getDataObjectDeserializer().getObject()
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read Stripe session"));
      activateUserSubscription(session);
    }
    if ("customer.subscription.deleted".equals(event.getType()) || "customer.subscription.paused".equals(event.getType())) {
      Subscription subscription = (Subscription) event.getDataObjectDeserializer().getObject()
          .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to read Stripe subscription"));
      downgradeUserSubscription(subscription.getId(), subscription.getStatus());
    }
    return new WebhookResponse("received");
  }

  private void activateUserSubscription(Session session) {
    Long userId = Long.valueOf(session.getClientReferenceId());
    AppUser user = userRepository.findById(userId)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    user.setPlan(Plan.PREMIUM);
    user.setStripeCustomerId(session.getCustomer());
    user.setStripeSubscriptionId(session.getSubscription());
    user.setSubscriptionStatus("active");
    user.setSubscriptionPlan(session.getMetadata() == null ? "premium" : session.getMetadata().getOrDefault("plan", "premium"));
  }

  private void downgradeUserSubscription(String subscriptionId, String status) {
    userRepository.findByStripeSubscriptionId(subscriptionId).ifPresent(user -> {
      user.setPlan(Plan.FREE);
      user.setSubscriptionStatus(status);
      user.setSubscriptionCurrentPeriodEnd(Instant.now());
    });
  }

  private boolean stripeConfigured() {
    return stripeSecretKey != null && !stripeSecretKey.isBlank();
  }

  private String priceIdFor(String plan) {
    return "branches".equals(normalizedPlan(plan)) ? branchesPriceId : premiumPriceId;
  }

  private String normalizedPlan(String plan) {
    if (plan == null || plan.isBlank()) return "premium";
    return plan.trim().toLowerCase();
  }

  public record BillingResponse(String plan, String message) {}
  public record CheckoutRequest(String plan, String paymentMethod) {}
  public record CheckoutResponse(String checkoutUrl) {}
  public record WebhookResponse(String status) {}
  public record SubscriptionResponse(String plan, String subscriptionPlan, String status, Instant currentPeriodEnd, boolean stripeConfigured) {
    static SubscriptionResponse from(AppUser user, boolean stripeConfigured) {
      return new SubscriptionResponse(
          user.getPlan().name(),
          user.getSubscriptionPlan(),
          user.getSubscriptionStatus(),
          user.getSubscriptionCurrentPeriodEnd(),
          stripeConfigured);
    }
  }
}
