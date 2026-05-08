package com.facturestudio.api.catalog;

import com.facturestudio.api.user.AppUser;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "catalog_items")
public class CatalogItem {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  private AppUser owner;

  @Column(nullable = false)
  private String name;

  @Column(length = 1200)
  private String description;

  @Column(nullable = false)
  private BigDecimal price = BigDecimal.ZERO;

  public Long getId() {
    return id;
  }

  public AppUser getOwner() {
    return owner;
  }

  public void setOwner(AppUser owner) {
    this.owner = owner;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public BigDecimal getPrice() {
    return price;
  }

  public void setPrice(BigDecimal price) {
    this.price = price;
  }
}
