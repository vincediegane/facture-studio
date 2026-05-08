package com.facturestudio.api.invoice;

import com.facturestudio.api.user.AppUser;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
  List<Invoice> findByOwnerOrderByCreatedAtDesc(AppUser owner);
  List<Invoice> findAllByOrderByCreatedAtDesc();
}
