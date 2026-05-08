package com.facturestudio.api.catalog;

import com.facturestudio.api.account.CurrentUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
  private final CatalogRepository catalogRepository;
  private final CurrentUserService currentUserService;

  public CatalogController(CatalogRepository catalogRepository, CurrentUserService currentUserService) {
    this.catalogRepository = catalogRepository;
    this.currentUserService = currentUserService;
  }

  @GetMapping
  public List<CatalogResponse> list(Principal principal) {
    return catalogRepository.findByOwnerOrderByNameAsc(currentUserService.requireUser(principal)).stream()
        .map(CatalogResponse::from)
        .toList();
  }

  @PostMapping
  public CatalogResponse create(@Valid @RequestBody CatalogRequest request, Principal principal) {
    CatalogItem item = new CatalogItem();
    item.setOwner(currentUserService.requireUser(principal));
    item.setName(request.name());
    item.setDescription(request.description());
    item.setPrice(request.price());
    return CatalogResponse.from(catalogRepository.save(item));
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable Long id, Principal principal) {
    var user = currentUserService.requireUser(principal);
    CatalogItem item = catalogRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catalog item not found"));
    if (!item.getOwner().getId().equals(user.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }
    catalogRepository.delete(item);
  }

  public record CatalogRequest(@NotBlank String name, String description, @NotNull BigDecimal price) {}

  public record CatalogResponse(Long id, String name, String description, BigDecimal price) {
    static CatalogResponse from(CatalogItem item) {
      return new CatalogResponse(item.getId(), item.getName(), item.getDescription(), item.getPrice());
    }
  }
}
