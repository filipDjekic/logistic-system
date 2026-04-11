package rs.logistics.logistics_system.entity;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import rs.logistics.logistics_system.enums.ProductUnit;

@Entity
@Table(name = "PRODUCTS")
@Getter
@Setter
@NoArgsConstructor
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "sku", nullable = false, unique = true, length = 50)
    private String sku;

    @Enumerated(EnumType.STRING)
    @Column(name = "unit", nullable = false, length = 20)
    private ProductUnit unit;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(name = "fragile", nullable = false)
    private Boolean fragile;

    @Column(name = "weight", nullable = false, precision = 12, scale = 2)
    private BigDecimal weight;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    //relations
    @OneToMany(mappedBy = "product")
    private List<WarehouseInventory> inventoryItems = new ArrayList<>();

    @OneToMany(mappedBy = "product")
    private List<StockMovement> stockMovements = new ArrayList<>();

    @OneToMany(mappedBy = "product")
    private List<TransportOrderItem> transportOrderItems = new ArrayList<>();

    public Product(String name,
                   String description,
                   String sku,
                   ProductUnit unit,
                   BigDecimal price,
                   Boolean fragile,
                   BigDecimal weight) {
        this.name = name;
        this.description = description;
        this.sku = sku;
        this.unit = unit;
        this.price = price;
        this.fragile = fragile;
        this.weight = weight;
        this.active = true;
    }

    // methods

    public boolean isOperational() {
        return Boolean.TRUE.equals(this.active);
    }
}
