package com.facturestudio.api.customer;

import com.facturestudio.api.account.CurrentUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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
@RequestMapping("/api/customers")
public class CustomerController {
  private final CustomerRepository customerRepository;
  private final CurrentUserService currentUserService;

  public CustomerController(CustomerRepository customerRepository, CurrentUserService currentUserService) {
    this.customerRepository = customerRepository;
    this.currentUserService = currentUserService;
  }

  @GetMapping
  public List<CustomerResponse> list(Principal principal) {
    return customerRepository.findByOwnerOrderByNameAsc(currentUserService.requireUser(principal)).stream()
        .map(CustomerResponse::from)
        .toList();
  }

  @PostMapping
  public CustomerResponse create(@Valid @RequestBody CustomerRequest request, Principal principal) {
    Customer customer = new Customer();
    customer.setOwner(currentUserService.requireUser(principal));
    customer.setName(request.name());
    customer.setEmail(request.email());
    customer.setAddress(request.address());
    return CustomerResponse.from(customerRepository.save(customer));
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable Long id, Principal principal) {
    var user = currentUserService.requireUser(principal);
    Customer customer = customerRepository.findById(id)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));
    if (!customer.getOwner().getId().equals(user.getId())) {
      throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
    }
    customerRepository.delete(customer);
  }

  public record CustomerRequest(@NotBlank String name, String email, String address) {}

  public record CustomerResponse(Long id, String name, String email, String address) {
    static CustomerResponse from(Customer customer) {
      return new CustomerResponse(customer.getId(), customer.getName(), customer.getEmail(), customer.getAddress());
    }
  }
}
