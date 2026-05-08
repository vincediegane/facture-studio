package com.facturestudio.api.customer;

import com.facturestudio.api.user.AppUser;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
  List<Customer> findByOwnerOrderByNameAsc(AppUser owner);
}
