package com.facturestudio.api.billing;

import com.facturestudio.api.account.CurrentUserService;
import com.facturestudio.api.user.AppUser;
import com.facturestudio.api.user.Plan;
import java.security.Principal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/billing")
public class BillingController {
  private final CurrentUserService currentUserService;

  public BillingController(CurrentUserService currentUserService) {
    this.currentUserService = currentUserService;
  }

  @PostMapping("/premium/mock")
  @Transactional
  public BillingResponse activatePremium(Principal principal) {
    AppUser user = currentUserService.requireUser(principal);
    user.setPlan(Plan.PREMIUM);
    return new BillingResponse(user.getPlan().name(), "Premium activated in mock mode");
  }

  public record BillingResponse(String plan, String message) {}
}
