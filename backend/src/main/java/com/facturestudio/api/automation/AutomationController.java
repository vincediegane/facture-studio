package com.facturestudio.api.automation;

import com.facturestudio.api.account.CurrentUserService;
import java.security.Principal;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/automations")
public class AutomationController {
  private final CurrentUserService currentUserService;

  public AutomationController(CurrentUserService currentUserService) {
    this.currentUserService = currentUserService;
  }

  @GetMapping("/recommendations")
  public List<AutomationRecommendation> recommendations(Principal principal) {
    currentUserService.requireUser(principal);
    return List.of(
        new AutomationRecommendation("Agent conformité", "Vérifier les champs fiscaux et totaux avant export", "HIGH"),
        new AutomationRecommendation("Agent relance", "Préparer les emails pour factures en retard", "MEDIUM"),
        new AutomationRecommendation("Agent reporting", "Résumer les revenus et impayés chaque lundi", "MEDIUM"));
  }

  public record AutomationRecommendation(String name, String description, String priority) {}
}
