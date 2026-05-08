package com.facturestudio.api.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<AppUser, Long> {
  Optional<AppUser> findByEmail(String email);

  Optional<AppUser> findByStripeSubscriptionId(String stripeSubscriptionId);

  boolean existsByEmail(String email);
}
