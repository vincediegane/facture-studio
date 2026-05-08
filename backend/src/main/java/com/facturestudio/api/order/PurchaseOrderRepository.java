package com.facturestudio.api.order;

import com.facturestudio.api.user.AppUser;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
  List<PurchaseOrder> findByOwnerOrderByCreatedAtDesc(AppUser owner);
  List<PurchaseOrder> findAllByOrderByCreatedAtDesc();
}
