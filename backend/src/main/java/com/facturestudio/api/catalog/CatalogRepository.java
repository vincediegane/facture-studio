package com.facturestudio.api.catalog;

import com.facturestudio.api.user.AppUser;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogRepository extends JpaRepository<CatalogItem, Long> {
  List<CatalogItem> findByOwnerOrderByNameAsc(AppUser owner);
}
